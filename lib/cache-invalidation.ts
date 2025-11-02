'use client';

import { useSWRConfig } from 'swr';

import { getAccountsCacheKey, getCacheKeyPattern } from 'lib/cache-keys';
import { useVault } from 'components/context/vault-provider';

interface InvalidateOptions {
	vaultId?: string;
	invalidateRelated?: boolean;
}

export const useCacheInvalidation = () => {
	const { mutate } = useSWRConfig();
	const { currentVault } = useVault();

	const invalidateCache = async (cacheKey: string, options?: { revalidate?: boolean }) => {
		return mutate(cacheKey, undefined, { revalidate: options?.revalidate !== false });
	};

	const invalidateRelatedCaches = async (
		entityType: 'expenses' | 'income' | 'investments' | 'accounts' | 'members' | 'subscriptions' | 'vaults',
		options?: InvalidateOptions
	) => {
		const vaultId = options?.vaultId || currentVault?.id;
		const invalidateRelated = options?.invalidateRelated !== false;

		const promises: Promise<any>[] = [];

		// Invalidate the entity's own cache
		if (entityType === 'expenses' || entityType === 'income' || entityType === 'investments') {
			// For dynamic entities, invalidate all cache keys matching the pattern
			const pattern = getCacheKeyPattern(entityType);
			promises.push(mutate((key) => typeof key === 'string' && key.startsWith(pattern), undefined, { revalidate: true }));
		} else if (entityType === 'accounts' && vaultId) {
			const accountsKey = getAccountsCacheKey(vaultId);
			promises.push(invalidateCache(accountsKey, { revalidate: true }));
		} else if (entityType === 'members' && vaultId) {
			const membersKey = getCacheKeyPattern('members');
			promises.push(mutate((key) => typeof key === 'string' && key.includes(`/api/members`), undefined, { revalidate: true }));
		} else if (entityType === 'subscriptions') {
			const subscriptionsKey = getCacheKeyPattern('subscriptions');
			promises.push(mutate((key) => typeof key === 'string' && key.startsWith(subscriptionsKey), undefined, { revalidate: true }));
		} else if (entityType === 'vaults') {
			promises.push(invalidateCache('/api/vaults', { revalidate: true }));
		}

		// Invalidate related caches for side effects
		if (invalidateRelated) {
			// When expenses/income/investments are added, invalidate accounts cache (affects balances)
			if (entityType === 'expenses' || entityType === 'income' || entityType === 'investments') {
				if (vaultId) {
					const accountsKey = getAccountsCacheKey(vaultId);
					promises.push(invalidateCache(accountsKey, { revalidate: true }));
				}

				// Also invalidate overview cache
				const overviewPattern = '/api/';
				promises.push(
					mutate(
						(key) =>
							typeof key === 'string' &&
							(key.startsWith('/api/expenses') ||
								key.startsWith('/api/income') ||
								key.startsWith('/api/investments') ||
								key.startsWith('/api/subscriptions')),
						undefined,
						{ revalidate: true }
					)
				);
			}

			// When accounts are modified, invalidate overview if needed
			if (entityType === 'accounts') {
				// Accounts changes might affect overview summaries
				const overviewPattern = '/api/';
				promises.push(
					mutate(
						(key) =>
							typeof key === 'string' &&
							(key.startsWith('/api/expenses') ||
								key.startsWith('/api/income') ||
								key.startsWith('/api/investments') ||
								key.startsWith('/api/subscriptions')),
						undefined,
						{ revalidate: true }
					)
				);
			}

			// When subscriptions are modified, invalidate overview
			if (entityType === 'subscriptions') {
				const overviewPattern = '/api/';
				promises.push(
					mutate(
						(key) =>
							typeof key === 'string' &&
							(key.startsWith('/api/expenses') ||
								key.startsWith('/api/income') ||
								key.startsWith('/api/investments') ||
								key.startsWith('/api/subscriptions')),
						undefined,
						{ revalidate: true }
					)
				);
			}
		}

		await Promise.all(promises);
	};

	return {
		invalidateCache,
		invalidateRelatedCaches,
	};
};

