'use client';

import { ColumnDef, RowData } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import DataTableColumnHeader from 'components/table/data-table-column-header';
import { Button } from 'components/ui/button';
import { Badge } from 'components/ui/badge';

export type Member = {
	id: string;
	name: string;
	notes?: string;
	active: boolean;
	created_at: string;
	updated_at: string;
	linked_accounts_count: number;
	expenses_count: number;
	income_count: number;
};

declare module '@tanstack/table-core' {
	interface ColumnMeta<TData extends RowData, TValue> {
		isTogglable: boolean;
	}
}

export const columns: ColumnDef<Member>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
		cell: ({ row }) => {
			return <div className="font-medium">{row.getValue('name')}</div>;
		},
	},
	{
		accessorKey: 'linked_accounts_count',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Linked Accounts" />,
		cell: ({ row }) => {
			const count = row.getValue<number>('linked_accounts_count');
			return <div className="">{count}</div>;
		},
	},
	{
		accessorKey: 'expenses_count',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Expenses" />,
		cell: ({ row }) => {
			const count = row.getValue<number>('expenses_count');
			return <div className="">{count}</div>;
		},
	},
	{
		accessorKey: 'income_count',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Income" />,
		cell: ({ row }) => {
			const count = row.getValue<number>('income_count');
			return <div className="">{count}</div>;
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

