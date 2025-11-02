'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import useSWR from 'swr';

import { views } from 'constants/table';
import { getApiUrl } from 'constants/url';

import { getEntityType, getSWRConfig } from 'lib/swr-config';

import { useVault } from './vault-provider';

const DataContext = createContext(null);

interface Data {
	Data: Array<any>;
}

type Props = {
	children: React.ReactNode;
	name: string;
	isNotRange?: boolean;
};

export const DataContextProvider = (props: Props) => {
	const { children, name, isNotRange = false } = props;
	const { currentVault, isLoading: vaultLoading } = useVault();
	const [filter, setFilter] = useState(views.thisMonth.key);
	const [categories, setCategories] = useState<string[]>([]);

	const entityType = getEntityType(name);
	const swrConfig = getSWRConfig(entityType);
	const cacheKey = currentVault && !vaultLoading ? getApiUrl(filter, name, categories, isNotRange, currentVault.id) : null;

	const { data = [], mutate, isLoading } = useSWR(cacheKey, {
		...swrConfig,
	});

	const onFilter = useCallback((categories: string[] = []) => {
		setCategories(categories);
	}, []);

	const value = useMemo(
		() => ({ data, loading: isLoading || vaultLoading, filter: { name: filter, setFilter, onFilter }, mutate }),
		[data, isLoading, vaultLoading, filter, mutate, onFilter]
	);

	return <DataContext.Provider value={value as any}>{children}</DataContext.Provider>;
};

export const useData = () => {
	const context = useContext<any>(DataContext);
	if (context === undefined) {
		throw new Error(`useData must be used within a DataContext.`);
	}
	return context;
};
