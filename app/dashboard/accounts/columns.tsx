'use client';

import { ColumnDef, RowData } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import DataTableColumnHeader from 'components/table/data-table-column-header';
import { Button } from 'components/ui/button';
import { Badge } from 'components/ui/badge';

import { formatCurrency } from 'lib/formatter';

import { accountTypes } from 'constants/accounts';

export type Account = {
	id: string;
	name: string;
	type: string;
	starting_balance: string;
	current_balance: string;
	notes?: string;
	member_id?: string | null;
	active: boolean;
	created_at: string;
	updated_at: string;
	member?: {
		id: string;
		name: string;
	} | null;
};

declare module '@tanstack/table-core' {
	interface ColumnMeta<TData extends RowData, TValue> {
		isTogglable: boolean;
	}
}

export const columns: ColumnDef<Account>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		cell: ({ row }) => {
			return <div className="font-medium">{row.getValue('name')}</div>;
		},
	},
	{
		accessorKey: 'type',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
		cell: ({ row }) => {
			const type = row.getValue<string>('type');
			const accountType = accountTypes[type as keyof typeof accountTypes];
			return (
				<Badge variant="outline" className="capitalize">
					{accountType?.name || type}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: 'current_balance',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
		cell: (props) => {
			const {
				row,
				table: { options },
			} = props;
			const user = options.meta?.user;
			const balance = parseFloat(row.getValue('current_balance') || '0');
			const formatted = formatCurrency({ value: balance, currency: user?.currency, locale: user?.locale });
			return <div className="font-medium tabular-nums">{formatted}</div>;
		},
	},
	{
		accessorKey: 'member',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
		cell: ({ row }) => {
			const member = row.original.member;
			return <div className="">{member?.name || 'Not linked'}</div>;
		},
	},
	{
		accessorKey: 'active',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
		cell: ({ row }) => {
			const active = row.getValue<boolean>('active');
			return (
				<Badge variant={active ? 'default' : 'secondary'}>
					{active ? 'Active' : 'Disabled'}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{ accessorKey: 'notes' },
	{
		accessorKey: 'actions',
		cell: (props) => {
			const {
				row,
				table: {
					options: { meta },
				},
			} = props;
			return (
				<div className="flex">
					<Button className="mr-1 rounded-lg p-0 hover:bg-transparent hover:opacity-70" variant={'ghost'}>
						<Pencil
							className="h-4 w-4"
							onClick={() => {
								meta?.onEdit(row.original);
							}}
						/>
					</Button>
					<Button className="ml-2 rounded-lg p-0 hover:bg-transparent hover:opacity-70" variant={'ghost'}>
						<Trash2
							className="h-4 w-4"
							onClick={() => {
								meta?.onDelete(row.original?.id);
							}}
						/>
					</Button>
				</div>
			);
		},
		meta: {
			isTogglable: false,
		},
	},
];

