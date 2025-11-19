'use client';

import { useCallback, useState, useEffect } from 'react';

import { toast } from 'sonner';

import { useUser } from 'components/context/auth-provider';
import { useVault } from 'components/context/vault-provider';
import DataTable from 'components/table/data-table';

import messages from 'constants/messages';

import { HoldingsData, UploadData, deleteUpload, getHoldings } from './apis';
import { columns } from './columns';

const longTermFilters = [
	{ label: 'All Holdings', value: 'all' },
	{ label: 'Long Term Only', value: 'longTerm' },
];

export default function HoldingsTable({ selectedUploadId }: { selectedUploadId?: string }) {
	const [data, setData] = useState<HoldingsData[]>([]);
	const [loading, setLoading] = useState(true);
	const [longTermFilter, setLongTermFilter] = useState('all');
	const user = useUser();
	const { currentVault } = useVault();

	const fetchData = useCallback(async () => {
		if (!currentVault?.id) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const result = await getHoldings(
				currentVault.id,
				selectedUploadId,
				longTermFilter === 'longTerm'
			);

			if (selectedUploadId) {
				setData(result.holdings || []);
			} else {
				// Flatten holdings from all uploads
				const allHoldings: HoldingsData[] = [];
				if (result.uploads) {
					result.uploads.forEach((upload: UploadData) => {
						if (upload.holdings) {
							allHoldings.push(...upload.holdings);
						}
					});
				}
				setData(allHoldings);
			}
		} catch (error: any) {
			console.error('Error fetching holdings:', error);
			toast.error(error.message || messages.error);
		} finally {
			setLoading(false);
		}
	}, [currentVault?.id, selectedUploadId, longTermFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const onDelete = useCallback(
		async (id: string) => {
			try {
				if (!currentVault?.id) {
					toast.error('Vault not selected');
					return;
				}
				await deleteUpload(id, currentVault.id);
				toast.success(messages.deleted);
				fetchData();
			} catch (error: any) {
				toast.error(error.message || messages.error);
			}
		},
		[fetchData, currentVault?.id]
	);

	const onEdit = useCallback(() => {
		// Holdings are read-only from uploads, no edit functionality needed
	}, []);

	const filter = {
		name: 'all',
		setFilter: () => {}, // Not used for tax-pnl, we have custom filters
		onFilter: () => {},
	};

	return (
		<>
			<div className="mb-4 flex gap-2">
				{longTermFilters.map((filterOption) => (
					<button
						key={filterOption.value}
						onClick={() => setLongTermFilter(filterOption.value)}
						className={`rounded-md px-3 py-1 text-sm ${
							longTermFilter === filterOption.value
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'
						}`}
					>
						{filterOption.label}
					</button>
				))}
			</div>
			<DataTable
				options={{ user, onDelete, onEdit }}
				filter={filter}
				columns={columns}
				data={data}
				loading={loading}
				filename="Tax P&L Holdings"
				hideViewOptions={true}
			/>
		</>
	);
}

