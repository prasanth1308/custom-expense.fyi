'use client';

import { ColumnDef } from '@tanstack/react-table';

import CurrencyCell from 'components/currency-cell';

export type recentActivities = {
	no: string;
	name: string;
	amount: string;
	category: string;
};

export const columns: ColumnDef<recentActivities>[] = [
	{
		accessorKey: 'no',
		header: 'No',
	},
	{
		accessorKey: 'name',
		header: 'Name',
	},
	{
		accessorKey: 'category',
		header: 'Type/Category',
	},
	{
		accessorKey: 'amount',
		header: 'Amount',
		cell: (props) => {
			const {
				row,
				table: { options },
			} = props;
			const user = options.meta?.user;
			const price = parseFloat(row.getValue('amount'));
			return <CurrencyCell value={price} currency={user?.currency} locale={user?.locale} className="tabular-nums font-medium" />;
		},
	},
];
