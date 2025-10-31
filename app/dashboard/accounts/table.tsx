'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import Add from 'components/add-button';
import { useUser } from 'components/context/auth-provider';
import { useData } from 'components/context/data-provider';
import { useVault } from 'components/context/vault-provider';
import DataTable from 'components/table/data-table';

import messages from 'constants/messages';
import { accountTypes } from 'constants/accounts';

import { AccountData, deleteAccount } from './apis';
import { columns } from './columns';

const accountTypeOptions = Object.keys(accountTypes).map((key) => ({
	label: accountTypes[key as keyof typeof accountTypes].name,
	value: key,
}));

export default function AccountsTable() {
	const [selected, setSelected] = useState({});
	const { data, loading, filter, mutate } = useData();
	const user = useUser();
	const { currentVault } = useVault();

	const onDelete = useCallback(
		async (id: string) => {
			try {
				if (!currentVault?.id) {
					toast.error('Vault not selected');
					return;
				}
				await deleteAccount(id, currentVault.id);
				toast.success(messages.deleted);
				mutate();
			} catch {
				toast.error(messages.error);
			}
		},
		[mutate, currentVault?.id]
	);

	const onEdit = useCallback(async (data: AccountData | any) => {
		setSelected(data);
	}, []);

	const onHide = useCallback(() => {
		setSelected({});
	}, []);

	const onLookup = useCallback(() => {
		return [];
	}, []);

	return (
		<>
			<DataTable
				options={{ user, onDelete, onEdit }}
				filter={filter}
				columns={columns}
				data={data}
				loading={loading}
				filename="Accounts"
				categories={accountTypeOptions}
			/>
			<Add onHide={onHide} onLookup={onLookup} selected={selected} mutate={mutate} type="accounts" />
		</>
	);
}

