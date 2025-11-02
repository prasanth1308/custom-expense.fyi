// SWR cache configuration constants and utilities

export const LESS_DYNAMIC_REVALIDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const DYNAMIC_REVALIDATE_INTERVAL = 2 * 60 * 1000; // 2 minutes
export const DEDUPING_INTERVAL = 2000; // 2 seconds to prevent duplicate requests

export type EntityType = 'less-dynamic' | 'dynamic';

export interface SWRConfigOptions {
	revalidateIfStale: boolean;
	dedupingInterval: number;
	revalidateOnFocus: boolean;
	revalidateOnReconnect: boolean;
}

export const getSWRConfig = (entityType: EntityType): Partial<SWRConfigOptions> => {
	const baseConfig = {
		revalidateIfStale: true,
		dedupingInterval: DEDUPING_INTERVAL,
		revalidateOnFocus: false,
		revalidateOnReconnect: true,
	};

	if (entityType === 'less-dynamic') {
		return {
			...baseConfig,
			// For less dynamic entities, we rely on manual invalidation and longer cache times
			// The dedupingInterval prevents duplicate requests within 2 seconds
		};
	}

	// Dynamic entities
	return {
		...baseConfig,
		// Dynamic entities refresh more frequently
	};
};

// Entity type classification
export const LESS_DYNAMIC_ENTITIES = ['vaults', 'accounts', 'subscriptions', 'members'];
export const DYNAMIC_ENTITIES = ['expenses', 'income', 'investments'];

export const getEntityType = (entityName: string): EntityType => {
	if (LESS_DYNAMIC_ENTITIES.includes(entityName)) {
		return 'less-dynamic';
	}
	if (DYNAMIC_ENTITIES.includes(entityName)) {
		return 'dynamic';
	}
	// Default to dynamic for unknown entities
	return 'dynamic';
};

