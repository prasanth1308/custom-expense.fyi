'use client';

import { useState, useCallback, useEffect } from 'react';

import LayoutHeader from 'components/layout/header';
import { useVault } from 'components/context/vault-provider';
import TaxPnlUpload from 'components/add/tax-pnl-upload';
import { Button } from 'components/ui/button';
import { Plus } from 'lucide-react';

import { getAppName } from 'lib/config';

import TaxPnlSummary from './summary';
import HoldingsTable from './table';
import { getHoldings, UploadData } from './apis';

export default function TaxPnlAnalyserPage() {
	const [showUpload, setShowUpload] = useState(false);
	const [selectedUploadId, setSelectedUploadId] = useState<string | undefined>();
	const [uploads, setUploads] = useState<UploadData[]>([]);
	const { currentVault } = useVault();

	const fetchUploads = useCallback(async () => {
		if (!currentVault?.id) return;

		try {
			const result = await getHoldings(currentVault.id);
			if (result.uploads) {
				setUploads(result.uploads);
			}
		} catch (error) {
			console.error('Error fetching uploads:', error);
		}
	}, [currentVault?.id]);

	// Fetch uploads on mount and when vault changes
	useEffect(() => {
		fetchUploads();
	}, [fetchUploads]);

	const handleUploadSuccess = () => {
		fetchUploads();
	};

	return (
		<>
			<LayoutHeader title="Tax P&L Analyser" />
			<div className="w-full overflow-x-auto p-4 pt-3">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex gap-2">
						<Button onClick={() => setShowUpload(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Upload Holdings
						</Button>
						{uploads.length > 0 && (
							<select
								className="rounded-md border border-input bg-background px-3 py-2 text-sm"
								value={selectedUploadId || 'all'}
								onChange={(e) => setSelectedUploadId(e.target.value === 'all' ? undefined : e.target.value)}
							>
								<option value="all">All Uploads</option>
								{uploads.map((upload) => (
									<option key={upload.id} value={upload.id}>
										{upload.file_name} ({new Date(upload.uploaded_at).toLocaleDateString()})
									</option>
								))}
							</select>
						)}
					</div>
				</div>

				<TaxPnlSummary selectedUploadId={selectedUploadId} />
				<HoldingsTable selectedUploadId={selectedUploadId} />

				<TaxPnlUpload show={showUpload} onHide={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />
			</div>
		</>
	);
}

