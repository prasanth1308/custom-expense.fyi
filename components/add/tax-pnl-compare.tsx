'use client';

import { useState, useRef } from 'react';

import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import CircleLoader from 'components/loader/circle';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';

import { parseKitePnl, LtcgTransaction } from 'lib/taxPnlParser';

import LtcgCompareReport from 'app/dashboard/tax-pnl-analyser/ltcg-compare-report';

interface TaxPnlCompareProps {
	show: boolean;
	onHide: () => void;
}

export default function TaxPnlCompare({ show, onHide }: TaxPnlCompareProps) {
	const [loading, setLoading] = useState(false);
	const [file1, setFile1] = useState<File | null>(null);
	const [file2, setFile2] = useState<File | null>(null);
	const [file1Transactions, setFile1Transactions] = useState<LtcgTransaction[]>([]);
	const [file2Transactions, setFile2Transactions] = useState<LtcgTransaction[]>([]);
	const file1InputRef = useRef<HTMLInputElement>(null);
	const file2InputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef(null);

	const handleFile1Select = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const fileExtension = file.name.split('.').pop()?.toLowerCase();
		if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
			toast.error('Please select an Excel or CSV file');
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			toast.error('File size should be less than 10MB');
			return;
		}

		setFile1(file);
		setFile1Transactions([]);
		setFile2Transactions([]);
	};

	const handleFile2Select = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const fileExtension = file.name.split('.').pop()?.toLowerCase();
		if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
			toast.error('Please select an Excel or CSV file');
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			toast.error('File size should be less than 10MB');
			return;
		}

		setFile2(file);
		setFile1Transactions([]);
		setFile2Transactions([]);
	};

	const handleCompare = async () => {
		if (!file1 || !file2) {
			toast.error('Please select both files');
			return;
		}

		setLoading(true);
		try {
			// Read both files as ArrayBuffer (works in browser)
			const [arrayBuffer1, arrayBuffer2] = await Promise.all([
				file1.arrayBuffer(),
				file2.arrayBuffer(),
			]);

			// Parse both files (parseKitePnl now supports ArrayBuffer)
			const parseResult1 = parseKitePnl(arrayBuffer1);
			const parseResult2 = parseKitePnl(arrayBuffer2);

			// Just store the transactions, no auto-matching
			setFile1Transactions(parseResult1.ltcgTransactions);
			setFile2Transactions(parseResult2.ltcgTransactions);
			toast.success('Files parsed successfully! Enter match numbers to pair transactions.');
		} catch (error: any) {
			console.error('Compare error:', error);
			toast.error(error.message || 'Failed to compare files. Please check the file format.');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setFile1(null);
		setFile2(null);
		setFile1Transactions([]);
		setFile2Transactions([]);
		if (file1InputRef.current) file1InputRef.current.value = '';
		if (file2InputRef.current) file2InputRef.current.value = '';
	};

	const hasResults = file1Transactions.length > 0 || file2Transactions.length > 0;

	return (
		<div className={show ? 'fixed inset-0 z-50 flex items-center justify-center' : 'hidden'}>
			{show && (
				<>
					<div className="fixed inset-0 bg-black bg-opacity-50" onClick={onHide} />
					<div className="relative w-full h-full max-w-[95vw] max-h-[95vh] bg-background rounded-lg shadow-2xl flex flex-col overflow-hidden">
						<div className="flex items-center justify-between p-4 border-b">
							<h2 className="text-lg font-semibold">Compare LTCG</h2>
							<button
								onClick={onHide}
								className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary"
							>
								×
							</button>
						</div>
						<div className="flex-1 overflow-hidden p-4">
							{!hasResults ? (
								<form
									className="md:[420px] grid w-full grid-cols-1 items-center gap-3"
									onSubmit={(e) => {
										e.preventDefault();
										handleCompare();
									}}
								>
									<div>
										<Label htmlFor="file1">First P&L File (Excel/CSV)</Label>
										<Input
											ref={file1InputRef}
											id="file1"
											type="file"
											accept=".xlsx,.xls,.csv"
											onChange={handleFile1Select}
											className="mt-1.5"
											required
										/>
										{file1 && (
											<p className="mt-1 text-sm text-muted-foreground">
												Selected: {file1.name} ({(file1.size / 1024).toFixed(2)} KB)
											</p>
										)}
									</div>

									<div>
										<Label htmlFor="file2">Second P&L File (Excel/CSV)</Label>
										<Input
											ref={file2InputRef}
											id="file2"
											type="file"
											accept=".xlsx,.xls,.csv"
											onChange={handleFile2Select}
											className="mt-1.5"
											required
										/>
										{file2 && (
											<p className="mt-1 text-sm text-muted-foreground">
												Selected: {file2.name} ({(file2.size / 1024).toFixed(2)} KB)
											</p>
										)}
									</div>

									<div className="flex gap-2">
										<Button disabled={loading || !file1 || !file2} className="mt-1.5 flex-1" type="submit">
											{loading ? <CircleLoader /> : 'Compare'}
										</Button>
										{(file1 || file2) && (
											<Button
												type="button"
												variant="outline"
												className="mt-1.5"
												onClick={handleReset}
												disabled={loading}
											>
												Reset
											</Button>
										)}
									</div>
								</form>
							) : (
								<div className="h-full flex flex-col">
									<div className="mb-4 flex justify-end">
										<Button variant="outline" onClick={handleReset} size="sm">
											Compare Another
										</Button>
									</div>
									<LtcgCompareReport 
										file1Transactions={file1Transactions}
										file2Transactions={file2Transactions}
										file1Name={file1?.name || 'File 1'}
										file2Name={file2?.name || 'File 2'}
									/>
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

