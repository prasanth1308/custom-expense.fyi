'use client';

import { useState, useEffect } from 'react';

import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Button } from 'components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import CurrencyCell from 'components/currency-cell';
import { useUser } from 'components/context/auth-provider';
import { useVault } from 'components/context/vault-provider';

import { compareUploads, getHoldings, UploadData } from './apis';

export default function CompareView() {
	const [uploads, setUploads] = useState<UploadData[]>([]);
	const [uploadId1, setUploadId1] = useState<string>('');
	const [uploadId2, setUploadId2] = useState<string>('');
	const [comparison, setComparison] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const user = useUser();
	const { currentVault } = useVault();

	useEffect(() => {
		if (!currentVault?.id) return;

		const fetchUploads = async () => {
			try {
				const result = await getHoldings(currentVault.id);
				if (result.uploads) {
					setUploads(result.uploads);
				}
			} catch (error) {
				console.error('Error fetching uploads:', error);
			}
		};

		fetchUploads();
	}, [currentVault?.id]);

	const handleCompare = async () => {
		if (!uploadId1 || !uploadId2) {
			toast.error('Please select both uploads to compare');
			return;
		}

		if (uploadId1 === uploadId2) {
			toast.error('Please select two different uploads');
			return;
		}

		if (!currentVault?.id) {
			toast.error('Vault not selected');
			return;
		}

		setLoading(true);
		try {
			const result = await compareUploads(uploadId1, uploadId2, currentVault.id);
			setComparison(result);
		} catch (error: any) {
			toast.error(error.message || 'Failed to compare uploads');
		} finally {
			setLoading(false);
		}
	};

	const upload1 = uploads.find((u) => u.id === uploadId1);
	const upload2 = uploads.find((u) => u.id === uploadId2);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Compare Uploads</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="mb-2 block text-sm font-medium">First Upload</label>
							<Select value={uploadId1} onValueChange={setUploadId1}>
								<SelectTrigger>
									<SelectValue placeholder="Select upload" />
								</SelectTrigger>
								<SelectContent>
									{uploads.map((upload) => (
										<SelectItem key={upload.id} value={upload.id}>
											{upload.file_name} ({new Date(upload.uploaded_at).toLocaleDateString()})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="mb-2 block text-sm font-medium">Second Upload</label>
							<Select value={uploadId2} onValueChange={setUploadId2}>
								<SelectTrigger>
									<SelectValue placeholder="Select upload" />
								</SelectTrigger>
								<SelectContent>
									{uploads.map((upload) => (
										<SelectItem key={upload.id} value={upload.id}>
											{upload.file_name} ({new Date(upload.uploaded_at).toLocaleDateString()})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<Button onClick={handleCompare} disabled={loading || !uploadId1 || !uploadId2}>
						{loading ? 'Comparing...' : 'Compare'}
					</Button>
				</CardContent>
			</Card>

			{comparison && (
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Upload 1</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">File: {comparison.upload1.file_name}</p>
								<p className="text-sm text-muted-foreground">
									Date: {new Date(comparison.upload1.uploaded_at).toLocaleDateString()}
								</p>
								<p className="text-sm">Total Holdings: {comparison.upload1.totalHoldings}</p>
								<p className="text-sm">Long Term: {comparison.upload1.longTermCount}</p>
								<p className="text-sm font-medium">
									Total P&L:{' '}
									<CurrencyCell
										value={comparison.upload1.totalPnl}
										currency={user?.currency}
										locale={user?.locale}
									/>
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Upload 2</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">File: {comparison.upload2.file_name}</p>
								<p className="text-sm text-muted-foreground">
									Date: {new Date(comparison.upload2.uploaded_at).toLocaleDateString()}
								</p>
								<p className="text-sm">Total Holdings: {comparison.upload2.totalHoldings}</p>
								<p className="text-sm">Long Term: {comparison.upload2.longTermCount}</p>
								<p className="text-sm font-medium">
									Total P&L:{' '}
									<CurrencyCell
										value={comparison.upload2.totalPnl}
										currency={user?.currency}
										locale={user?.locale}
									/>
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Comparison Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Added</p>
									<p className="text-2xl font-bold">{comparison.comparison.added}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Removed</p>
									<p className="text-2xl font-bold">{comparison.comparison.removed}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Changed</p>
									<p className="text-2xl font-bold">{comparison.comparison.changed}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">P&L Difference</p>
									<p
										className={`text-2xl font-bold ${
											comparison.comparison.pnlDifference >= 0 ? 'text-green-600' : 'text-red-600'
										}`}
									>
										<CurrencyCell
											value={comparison.comparison.pnlDifference}
											currency={user?.currency}
											locale={user?.locale}
										/>
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}

