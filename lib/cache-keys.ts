// Cache key generation utilities for consistent cache key management

import { getApiUrl } from 'constants/url';

export const getEntityCacheKey = (entity: string, params?: Record<string, any>): string => {
	if (entity === 'vaults') {
		return '/api/vaults';
	}

	if (entity === 'accounts') {
		const vaultId = params?.vaultId;
		return vaultId ? `/api/accounts?vaultId=${vaultId}` : '/api/accounts';
	}

	if (entity === 'members') {
		const vaultId = params?.vaultId;
		return vaultId ? `/api/members?vaultId=${vaultId}` : '/api/members';
	}

	if (entity === 'subscriptions') {
		const vaultId = params?.vaultId;
		const from = params?.from;
		const to = params?.to;
		const categories = params?.categories;

		if (from && to) {
			return getApiUrl('custom', 'subscriptions', categories || [], false, vaultId);
		}
		return vaultId ? `/api/subscriptions?vaultId=${vaultId}` : '/api/subscriptions';
	}

	if (entity === 'expenses') {
		const vaultId = params?.vaultId;
		const from = params?.from;
		const to = params?.to;
		const categories = params?.categories;
		const filter = params?.filter || 'thisMonth';

		if (from && to) {
			return getApiUrl('custom', 'expenses', categories || [], false, vaultId);
		}
		return getApiUrl(filter, 'expenses', categories || [], false, vaultId);
	}

	if (entity === 'income') {
		const vaultId = params?.vaultId;
		const from = params?.from;
		const to = params?.to;
		const categories = params?.categories;
		const filter = params?.filter || 'thisMonth';

		if (from && to) {
			return getApiUrl('custom', 'income', categories || [], false, vaultId);
		}
		return getApiUrl(filter, 'income', categories || [], false, vaultId);
	}

	if (entity === 'investments') {
		const vaultId = params?.vaultId;
		const from = params?.from;
		const to = params?.to;
		const categories = params?.categories;
		const filter = params?.filter || 'thisMonth';

		if (from && to) {
			return getApiUrl('custom', 'investments', categories || [], false, vaultId);
		}
		return getApiUrl(filter, 'investments', categories || [], false, vaultId);
	}

	// Fallback
	return `/api/${entity}`;
};

export const getAccountsCacheKey = (vaultId: string): string => {
	return getEntityCacheKey('accounts', { vaultId });
};

export const getMembersCacheKey = (vaultId: string): string => {
	return getEntityCacheKey('members', { vaultId });
};

export const getVaultsCacheKey = (): string => {
	return getEntityCacheKey('vaults');
};

export const getExpensesCacheKey = (from: string, to: string, vaultId: string, categories?: string[]): string => {
	return getEntityCacheKey('expenses', { from, to, vaultId, categories });
};

export const getIncomeCacheKey = (from: string, to: string, vaultId: string, categories?: string[]): string => {
	return getEntityCacheKey('income', { from, to, vaultId, categories });
};

export const getInvestmentsCacheKey = (from: string, to: string, vaultId: string, categories?: string[]): string => {
	return getEntityCacheKey('investments', { from, to, vaultId, categories });
};

export const getSubscriptionsCacheKey = (from: string, to: string, vaultId: string, categories?: string[]): string => {
	return getEntityCacheKey('subscriptions', { from, to, vaultId, categories });
};

// Helper to get cache key pattern for partial matching (useful for invalidation)
export const getCacheKeyPattern = (entity: string): string => {
	return `/api/${entity}`;
};

