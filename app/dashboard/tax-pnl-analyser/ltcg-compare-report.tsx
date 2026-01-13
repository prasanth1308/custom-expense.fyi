'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import CurrencyCell from 'components/currency-cell';
import { Input } from 'components/ui/input';
import { Button } from 'components/ui/button';
import { useUser } from 'components/context/auth-provider';
import { formatDate } from 'lib/formatter';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { LtcgTransaction } from 'lib/taxPnlParser';

interface LtcgCompareReportProps {
	file1Transactions: LtcgTransaction[];
	file2Transactions: LtcgTransaction[];
	file1Name: string;
	file2Name: string;
}

interface TransactionWithMatch extends LtcgTransaction {
	originalIndex: number;
	matchNumber?: number;
	value: number;
}

export default function LtcgCompareReport({ 
	file1Transactions, 
	file2Transactions,
	file1Name,
	file2Name 
}: LtcgCompareReportProps) {
	const user = useUser();
	const [file1Matches, setFile1Matches] = useState<Record<number, number>>({});
	const [file2Matches, setFile2Matches] = useState<Record<number, number>>({});
	const [autoMatched, setAutoMatched] = useState(false);

	// Calculate value for each transaction (quantity * price)
	// For holdings: value = LT Qty * CMP (or current price)
	// For P&L: value = quantity * sellPrice (or use amount as value)
	const calculateValue = useCallback((t: LtcgTransaction): number => {
		if (t.sellPrice && t.quantity) {
			return t.sellPrice * t.quantity;
		}
		// Fallback: use absolute amount as value estimate
		return Math.abs(t.amount);
	}, []);

	// Add original index and calculated value to transactions, then sort by value descending
	const file1WithIndex: TransactionWithMatch[] = file1Transactions
		.map((t, i) => ({
			...t,
			originalIndex: i,
			matchNumber: file1Matches[i],
			value: calculateValue(t),
		}))
		.sort((a, b) => b.value - a.value); // Sort by value descending

	const file2WithIndex: TransactionWithMatch[] = file2Transactions
		.map((t, i) => ({
			...t,
			originalIndex: i,
			matchNumber: file2Matches[i],
			value: calculateValue(t),
		}))
		.sort((a, b) => b.value - a.value); // Sort by value descending

	// Auto-match: Match gains from file1 with losses from file2 (by P/L amount)
	useEffect(() => {
		if (autoMatched || file1Transactions.length === 0 || file2Transactions.length === 0) return;
		
		// Calculate value and create indexed transactions
		const file1Gains = file1Transactions
			.map((t, i) => ({ ...t, originalIndex: i, value: calculateValue(t) }))
			.filter((t) => t.amount > 0)
			.sort((a, b) => b.value - a.value);
		
		const file2Losses = file2Transactions
			.map((t, i) => ({ ...t, originalIndex: i, value: calculateValue(t) }))
			.filter((t) => t.amount < 0)
			.sort((a, b) => b.value - a.value);
		
		if (file1Gains.length === 0 || file2Losses.length === 0) return;

		const newFile1Matches: Record<number, number> = {};
		const newFile2Matches: Record<number, number> = {};
		const usedFile2Indices = new Set<number>();
		let matchNumber = 1;

		// For each gain in file1, find the best matching loss in file2
		file1Gains.forEach((gain) => {
			// Find the best matching loss (closest P/L amount)
			let bestMatch: typeof file2Losses[0] | null = null;
			let bestDiff = Infinity;

			file2Losses.forEach((loss) => {
				if (usedFile2Indices.has(loss.originalIndex)) return; // Already used

				const diff = Math.abs(Math.abs(gain.amount) - Math.abs(loss.amount));
				if (diff < bestDiff) {
					bestDiff = diff;
					bestMatch = loss;
				}
			});

			// If found a good match (within 10% difference or exact match)
			if (bestMatch && (bestDiff < Math.abs(gain.amount) * 0.1 || bestDiff < 100)) {
				newFile1Matches[gain.originalIndex] = matchNumber;
				newFile2Matches[bestMatch.originalIndex] = matchNumber;
				usedFile2Indices.add(bestMatch.originalIndex);
				matchNumber++;
			}
		});

		if (Object.keys(newFile1Matches).length > 0) {
			setFile1Matches(newFile1Matches);
			setFile2Matches(newFile2Matches);
			setAutoMatched(true);
		}
	}, [file1Transactions, file2Transactions, autoMatched, calculateValue]);

	// Calculate summaries
	const file1Summary = useMemo(() => {
		const gains = file1Transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
		const losses = Math.abs(file1Transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
		const totalAmount = file1WithIndex.reduce((sum, t) => sum + t.value, 0);
		return { gains, losses, net: gains - losses, totalAmount };
	}, [file1Transactions, file1WithIndex]);

	const file2Summary = useMemo(() => {
		const gains = file2Transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
		const losses = Math.abs(file2Transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
		const totalAmount = file2WithIndex.reduce((sum, t) => sum + t.value, 0);
		return { gains, losses, net: gains - losses, totalAmount };
	}, [file2Transactions, file2WithIndex]);

	// Get matched pairs based on match numbers
	const matchedPairs = useMemo(() => {
		const pairs: Array<{
			matchNumber: number;
			file1: TransactionWithMatch;
			file2: TransactionWithMatch;
			matchedAmount: number;
		}> = [];

		// Group by match number
		const file1ByMatch = new Map<number, TransactionWithMatch[]>();
		const file2ByMatch = new Map<number, TransactionWithMatch[]>();

		file1WithIndex.forEach((t) => {
			if (t.matchNumber !== undefined) {
				if (!file1ByMatch.has(t.matchNumber)) {
					file1ByMatch.set(t.matchNumber, []);
				}
				file1ByMatch.get(t.matchNumber)!.push(t);
			}
		});

		file2WithIndex.forEach((t) => {
			if (t.matchNumber !== undefined) {
				if (!file2ByMatch.has(t.matchNumber)) {
					file2ByMatch.set(t.matchNumber, []);
				}
				file2ByMatch.get(t.matchNumber)!.push(t);
			}
		});

		// Create pairs
		const allMatchNumbers = new Set([...file1ByMatch.keys(), ...file2ByMatch.keys()]);
		allMatchNumbers.forEach((matchNum) => {
			const file1Items = file1ByMatch.get(matchNum) || [];
			const file2Items = file2ByMatch.get(matchNum) || [];

			// Match each file1 item with each file2 item that has the same match number
			file1Items.forEach((f1) => {
				file2Items.forEach((f2) => {
					// Only match gains with losses
					if ((f1.amount > 0 && f2.amount < 0) || (f1.amount < 0 && f2.amount > 0)) {
						pairs.push({
							matchNumber: matchNum,
							file1: f1,
							file2: f2,
							matchedAmount: Math.min(Math.abs(f1.amount), Math.abs(f2.amount)),
						});
					}
				});
			});
		});

		// Sort by match number
		return pairs.sort((a, b) => a.matchNumber - b.matchNumber);
	}, [file1WithIndex, file2WithIndex]);

	const handleFile1MatchChange = (originalIndex: number, value: string) => {
		const num = value === '' ? undefined : parseInt(value, 10);
		if (num !== undefined && isNaN(num)) return;
		setFile1Matches((prev) => {
			const newMatches = { ...prev };
			if (num === undefined) {
				delete newMatches[originalIndex];
			} else {
				newMatches[originalIndex] = num;
			}
			return newMatches;
		});
	};

	const handleFile2MatchChange = (originalIndex: number, value: string) => {
		const num = value === '' ? undefined : parseInt(value, 10);
		if (num !== undefined && isNaN(num)) return;
		setFile2Matches((prev) => {
			const newMatches = { ...prev };
			if (num === undefined) {
				delete newMatches[originalIndex];
			} else {
				newMatches[originalIndex] = num;
			}
			return newMatches;
		});
	};

	const handleDownloadCSV = () => {
		try {
			// Prepare CSV data
			const csvRows: string[] = [];
			
			// Header
			csvRows.push('Match Number,File 1 Symbol,File 1 P/L,File 1 Amount,File 2 Symbol,File 2 P/L,File 2 Amount,Matched Amount');
			
			// Matched pairs
			matchedPairs.forEach((pair) => {
				csvRows.push(
					`${pair.matchNumber},"${pair.file1.symbol}",${pair.file1.amount},${pair.file1.value},"${pair.file2.symbol}",${pair.file2.amount},${pair.file2.value},${pair.matchedAmount}`
				);
			});

			// Unmatched from file 1
			file1WithIndex
				.filter((t) => t.matchNumber === undefined)
				.forEach((t) => {
					csvRows.push(`,"${t.symbol}",${t.amount},${t.value},,,"`);
				});

			// Unmatched from file 2
			file2WithIndex
				.filter((t) => t.matchNumber === undefined)
				.forEach((t) => {
					csvRows.push(`,,,"${t.symbol}",${t.amount},${t.value},"`);
				});

			const csvContent = csvRows.join('\n');
			const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
			const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `ltcg-comparison-${new Date().toISOString().split('T')[0]}.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			setTimeout(() => {
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			}, 100);
		} catch (error) {
			console.error('CSV download error:', error);
			toast.error('Failed to download CSV');
		}
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header with summaries and download */}
			<div className="mb-4 flex items-center justify-between">
				<div className="grid grid-cols-2 gap-4 flex-1">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">{file1Name}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-lg font-bold">
								<CurrencyCell value={file1Summary.net} currency={user?.currency} locale={user?.locale} />
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Gains: <CurrencyCell value={file1Summary.gains} currency={user?.currency} locale={user?.locale} className="text-xs" /> | 
								Losses: <CurrencyCell value={file1Summary.losses} currency={user?.currency} locale={user?.locale} className="text-xs" />
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Total Amount: <CurrencyCell value={file1Summary.totalAmount} currency={user?.currency} locale={user?.locale} className="text-xs font-semibold" />
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium">{file2Name}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-lg font-bold">
								<CurrencyCell value={file2Summary.net} currency={user?.currency} locale={user?.locale} />
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Gains: <CurrencyCell value={file2Summary.gains} currency={user?.currency} locale={user?.locale} className="text-xs" /> | 
								Losses: <CurrencyCell value={file2Summary.losses} currency={user?.currency} locale={user?.locale} className="text-xs" />
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Total Amount: <CurrencyCell value={file2Summary.totalAmount} currency={user?.currency} locale={user?.locale} className="text-xs font-semibold" />
							</p>
						</CardContent>
					</Card>
				</div>
				<Button onClick={handleDownloadCSV} className="ml-4">
					<Download className="mr-2 h-4 w-4" />
					Download CSV
				</Button>
			</div>

			{/* Side by side tables */}
			<div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
				{/* File 1 Table */}
				<Card className="flex flex-col overflow-hidden">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">{file1Name} ({file1Transactions.length})</CardTitle>
					</CardHeader>
					<CardContent className="flex-1 overflow-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-background">
								<tr className="border-b">
									<th className="text-left p-2">Match #</th>
									<th className="text-left p-2">Symbol</th>
									<th className="text-left p-2">Date</th>
									<th className="text-right p-2">Qty</th>
									<th className="text-right p-2">P/L</th>
									<th className="text-right p-2">Amount</th>
								</tr>
							</thead>
							<tbody>
								{file1WithIndex.map((transaction, index) => (
									<tr key={index} className="border-b hover:bg-muted/50">
										<td className="p-2">
											<Input
												type="number"
												value={transaction.matchNumber ?? ''}
												onChange={(e) => handleFile1MatchChange(transaction.originalIndex, e.target.value)}
												className="w-20 h-8 text-xs"
												placeholder="#"
												min="1"
											/>
										</td>
										<td className="p-2 font-medium">{transaction.symbol}</td>
										<td className="p-2 text-muted-foreground text-xs">
											{formatDate({ date: transaction.date, locale: user?.locale })}
										</td>
										<td className="p-2 text-right">{transaction.quantity.toLocaleString()}</td>
										<td className={`p-2 text-right font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											<CurrencyCell
												value={Math.abs(transaction.amount)}
												currency={user?.currency}
												locale={user?.locale}
												className="tabular-nums"
											/>
										</td>
										<td className="p-2 text-right font-medium">
											<CurrencyCell
												value={transaction.value}
												currency={user?.currency}
												locale={user?.locale}
												className="tabular-nums"
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>

				{/* File 2 Table */}
				<Card className="flex flex-col overflow-hidden">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">{file2Name} ({file2Transactions.length})</CardTitle>
					</CardHeader>
					<CardContent className="flex-1 overflow-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-background">
								<tr className="border-b">
									<th className="text-left p-2">Match #</th>
									<th className="text-left p-2">Symbol</th>
									<th className="text-left p-2">Date</th>
									<th className="text-right p-2">Qty</th>
									<th className="text-right p-2">P/L</th>
									<th className="text-right p-2">Amount</th>
								</tr>
							</thead>
							<tbody>
								{file2WithIndex.map((transaction, index) => (
									<tr key={index} className="border-b hover:bg-muted/50">
										<td className="p-2">
											<Input
												type="number"
												value={transaction.matchNumber ?? ''}
												onChange={(e) => handleFile2MatchChange(transaction.originalIndex, e.target.value)}
												className="w-20 h-8 text-xs"
												placeholder="#"
												min="1"
											/>
										</td>
										<td className="p-2 font-medium">{transaction.symbol}</td>
										<td className="p-2 text-muted-foreground text-xs">
											{formatDate({ date: transaction.date, locale: user?.locale })}
										</td>
										<td className="p-2 text-right">{transaction.quantity.toLocaleString()}</td>
										<td className={`p-2 text-right font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
											<CurrencyCell
												value={Math.abs(transaction.amount)}
												currency={user?.currency}
												locale={user?.locale}
												className="tabular-nums"
											/>
										</td>
										<td className="p-2 text-right font-medium">
											<CurrencyCell
												value={transaction.value}
												currency={user?.currency}
												locale={user?.locale}
												className="tabular-nums"
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			</div>

			{/* Matched Pairs Table */}
			{matchedPairs.length > 0 && (
				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Matched Pairs ({matchedPairs.length}) - Sorted by Match Number</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left p-2">Match #</th>
										<th className="text-left p-2">File 1 (Symbol)</th>
										<th className="text-right p-2">File 1 P/L</th>
										<th className="text-right p-2">File 1 Amount</th>
										<th className="text-left p-2">File 2 (Symbol)</th>
										<th className="text-right p-2">File 2 P/L</th>
										<th className="text-right p-2">File 2 Amount</th>
										<th className="text-right p-2">Matched Amount</th>
									</tr>
								</thead>
								<tbody>
									{matchedPairs.map((pair, index) => (
										<tr key={index} className="border-b hover:bg-muted/50">
											<td className="p-2 font-semibold">{pair.matchNumber}</td>
											<td className="p-2 font-medium">{pair.file1.symbol}</td>
											<td className={`p-2 text-right ${pair.file1.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
												<CurrencyCell
													value={Math.abs(pair.file1.amount)}
													currency={user?.currency}
													locale={user?.locale}
													className="tabular-nums"
												/>
											</td>
											<td className="p-2 text-right font-medium">
												<CurrencyCell
													value={pair.file1.value}
													currency={user?.currency}
													locale={user?.locale}
													className="tabular-nums"
												/>
											</td>
											<td className="p-2 font-medium">{pair.file2.symbol}</td>
											<td className={`p-2 text-right ${pair.file2.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
												<CurrencyCell
													value={Math.abs(pair.file2.amount)}
													currency={user?.currency}
													locale={user?.locale}
													className="tabular-nums"
												/>
											</td>
											<td className="p-2 text-right font-medium">
												<CurrencyCell
													value={pair.file2.value}
													currency={user?.currency}
													locale={user?.locale}
													className="tabular-nums"
												/>
											</td>
											<td className="p-2 text-right font-semibold">
												<CurrencyCell
													value={pair.matchedAmount}
													currency={user?.currency}
													locale={user?.locale}
													className="tabular-nums"
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
