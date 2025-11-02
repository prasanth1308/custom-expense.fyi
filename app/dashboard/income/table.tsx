'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import Add from 'components/add-button';
import { useUser } from 'components/context/auth-provider';
import { useData } from 'components/context/data-provider';
import { useVault } from 'components/context/vault-provider';
import { useCacheInvalidation } from 'lib/cache-invalidation';
import DataTable from 'components/table/data-table';

import { lookup } from 'lib/lookup';

import { incomeCategory } from 'constants/categories';
import messages from 'constants/messages';

import { IncomeData, deleteIncome } from './apis';
import { columns } from './columns';

const categories = Object.keys(incomeCategory)
	.filter(Boolean)
	.map((categoryKey) => ({
		label: incomeCategory[categoryKey],
		value: categoryKey,
	}));

export default function IncomeTable() {
	const [selected, setSelected] = useState({});
	const { data, loading, filter, mutate } = useData();
	const user = useUser();
	const { currentVault } = useVault();
	const { invalidateRelatedCaches } = useCacheInvalidation();

	const onDelete = useCallback(
		async (id: string) => {
			try {
				if (!currentVault?.id) {
					toast.error('Vault not selected');
					return;
				}
				await deleteIncome(id, currentVault.id);
				toast.success(messages.deleted);
				// Invalidate related caches (income, accounts, overview)
				await invalidateRelatedCaches('income', { vaultId: currentVault.id });
				mutate();
			} catch {
				toast.error(messages.error);
			}
		},
		[mutate, currentVault?.id, invalidateRelatedCaches]
	);

	const onEdit = useCallback(async (data: IncomeData | any) => {
		setSelected(data);
	}, []);

	const onHide = useCallback(() => {
		setSelected({});
	}, []);

	const onLookup = useCallback((name: string) => lookup({ data, name }), [data]);

	return (
		<>
			<DataTable
				options={{ user, onDelete, onEdit }}
				filter={filter}
				columns={columns}
				data={data}
				loading={loading}
				filename="Income"
				categories={categories}
			/>
			<Add onHide={onHide} onLookup={onLookup} selected={selected} mutate={mutate} type="income" />
		</>
	);
}
