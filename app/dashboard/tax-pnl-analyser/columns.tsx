'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from 'components/ui/badge';

import DataTableColumnHeader from 'components/table/data-table-column-header';
import CurrencyCell from 'components/currency-cell';
import { formatDate } from 'lib/formatter';

export type Holdings = {
	id: string;
	symbol: string;
	quantity: string;
	quantity_long_term: string;
	average_price: string;
	current_price: string;
	purchase_date: string;
	pnl: string;
	pnl_percentage: string;
	holding_period_days: number;
	is_long_term: boolean;
	created_at: string;
	updated_at: string;
	upload_id: string;
};

export const columns: ColumnDef<Holdings>[] = [
	{
		accessorKey: 'name',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Symbol" />,
		cell: ({ row }) => {
			const symbol = row.original.symbol;
			const quantityLongTerm = parseFloat(row.original.quantity_long_term || '0');
			const totalQuantity = parseFloat(row.original.quantity || '0');
			const isFullyLongTerm = quantityLongTerm === totalQuantity && totalQuantity > 0;
			const hasPartialLongTerm = quantityLongTerm > 0 && quantityLongTerm < totalQuantity;
			return (
				<div className="flex items-center gap-2">
					<div className="font-medium">{symbol}</div>
					{isFullyLongTerm && (
						<Badge variant="secondary" className="text-xs">
							LT
						</Badge>
					)}
					{hasPartialLongTerm && (
						<Badge variant="outline" className="text-xs">
							Partial LT
						</Badge>
					)}
				</div>
			);
		},
		accessorFn: (row) => row.symbol, // Map symbol to name for search functionality
	},
	{
		accessorKey: 'quantity',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Total Qty" />,
		cell: ({ row }) => {
			const quantity = parseFloat(row.getValue('quantity') || '0');
			return <div className="tabular-nums">{quantity.toLocaleString()}</div>;
		},
	},
	{
		accessorKey: 'quantity_long_term',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Long Term Qty" />,
		cell: ({ row }) => {
			const quantityLongTerm = parseFloat(row.getValue('quantity_long_term') || '0');
			const totalQuantity = parseFloat(row.original.quantity || '0');
			const isFullyLongTerm = quantityLongTerm === totalQuantity && totalQuantity > 0;
			return (
				<div className="tabular-nums">
					<span className={isFullyLongTerm ? 'text-green-600 font-medium' : ''}>
						{quantityLongTerm.toLocaleString()}
					</span>
					{totalQuantity > 0 && quantityLongTerm < totalQuantity && (
						<span className="ml-1 text-xs text-muted-foreground">
							({((quantityLongTerm / totalQuantity) * 100).toFixed(0)}%)
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'average_price',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Avg Price" />,
		cell: (props) => {
			const {
				row,
				table: { options },
			} = props;
			const user = options.meta?.user;
			const price = parseFloat(row.getValue('average_price') || '0');
			return <CurrencyCell value={price} currency={user?.currency} locale={user?.locale} />;
		},
	},
	{
		accessorKey: 'current_price',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Current Price" />,
		cell: (props) => {
			const {
				row,
				table: { options },
			} = props;
			const user = options.meta?.user;
			const price = parseFloat(row.getValue('current_price') || '0');
			return <CurrencyCell value={price} currency={user?.currency} locale={user?.locale} />;
		},
	},
	{
		accessorKey: 'purchase_date',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Purchase Date" />,
		cell: (props) => {
			const {
				row,
				table: { options },
			} = props;
			const user = options.meta?.user;
			const date = row.getValue<string>('purchase_date');
			const formatted = formatDate({ date, locale: user?.locale });
			return <div className="">{formatted}</div>;
		},
	},
	{
		accessorKey: 'holding_period_days',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Holding Period" />,
		cell: ({ row }) => {
			const days = row.getValue<number>('holding_period_days');
			const years = Math.floor(days / 365);
			const months = Math.floor((days % 365) / 30);
			if (years > 0) {
				return <div>{years}Y {months}M</div>;
			}
			return <div>{months}M</div>;
		},
	},
	{
		accessorKey: 'pnl',
		header: ({ column }) => <DataTableColumnHeader column={column} title="P&L" />,
		cell: (props) => {
			const {
				row,
				table: { options },
			} = props;
			const user = options.meta?.user;
			const pnl = parseFloat(row.getValue('pnl') || '0');
			const isPositive = pnl >= 0;
			return (
				<div className={isPositive ? 'text-green-600' : 'text-red-600'}>
					<CurrencyCell value={pnl} currency={user?.currency} locale={user?.locale} />
				</div>
			);
		},
	},
	{
		accessorKey: 'pnl_percentage',
		header: ({ column }) => <DataTableColumnHeader column={column} title="P&L %" />,
		cell: ({ row }) => {
			const pnlPct = parseFloat(row.getValue('pnl_percentage') || '0');
			const isPositive = pnlPct >= 0;
			return (
				<div className={isPositive ? 'text-green-600' : 'text-red-600'}>
					{pnlPct.toFixed(2)}%
				</div>
			);
		},
	},
	{
		accessorKey: 'is_long_term',
		header: ({ column }) => <DataTableColumnHeader column={column} title="Long Term" />,
		cell: ({ row }) => {
			const isLongTerm = row.getValue<boolean>('is_long_term');
			return (
				<Badge variant={isLongTerm ? 'default' : 'outline'}>
					{isLongTerm ? 'Yes' : 'No'}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
];

