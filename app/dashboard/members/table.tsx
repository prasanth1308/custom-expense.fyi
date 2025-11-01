'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import Add from 'components/add-button';
import { useUser } from 'components/context/auth-provider';
import { useData } from 'components/context/data-provider';
import { useVault } from 'components/context/vault-provider';
import DataTable from 'components/table/data-table';

import messages from 'constants/messages';

import { MemberData, deleteMember } from './apis';
import { columns } from './columns';

export default function MembersTable() {
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
				await deleteMember(id, currentVault.id);
				toast.success(messages.deleted);
				mutate();
			} catch {
				toast.error(messages.error);
			}
		},
		[mutate, currentVault?.id]
	);

	const onEdit = useCallback(async (data: MemberData | any) => {
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
				filename="Members"
				hideViewOptions={true}
			/>
			<Add onHide={onHide} onLookup={onLookup} selected={selected} mutate={mutate} type="members" />
		</>
	);
}

