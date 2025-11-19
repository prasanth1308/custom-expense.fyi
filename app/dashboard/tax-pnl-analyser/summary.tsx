'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import CurrencyCell from 'components/currency-cell';
import { useUser } from 'components/context/auth-provider';
import { useVault } from 'components/context/vault-provider';

import { calculateTaxSavings } from 'lib/taxPnlParser';

import { getHoldings } from './apis';

export default function TaxPnlSummary({ selectedUploadId }: { selectedUploadId?: string }) {
	const [stats, setStats] = useState({
		totalHoldings: 0,
		longTermCount: 0,
		totalPnl: 0,
		longTermPnl: 0,
		taxSavings: 0,
	});
	const [loading, setLoading] = useState(true);
	const user = useUser();
	const { currentVault } = useVault();

	useEffect(() => {
		if (!currentVault?.id) {
			setLoading(false);
			return;
		}

		const fetchStats = async () => {
			setLoading(true);
			try {
				const result = await getHoldings(currentVault.id, selectedUploadId);

				let allHoldings: any[] = [];
				if (selectedUploadId) {
					allHoldings = result.holdings || [];
				} else {
					if (result.uploads) {
						result.uploads.forEach((upload: any) => {
							if (upload.holdings) {
								allHoldings.push(...upload.holdings);
							}
						});
					}
				}

				// Count holdings with any long-term quantity
				const longTermHoldings = allHoldings.filter((h) => parseFloat(h.quantity_long_term || '0') > 0);
				const totalPnl = allHoldings.reduce((sum, h) => sum + parseFloat(h.pnl || '0'), 0);
				
				// Calculate long-term P&L based on proportion of long-term quantity
				const longTermPnl = allHoldings.reduce((sum, h) => {
					const totalQty = parseFloat(h.quantity || '0');
					const longTermQty = parseFloat(h.quantity_long_term || '0');
					if (totalQty > 0 && longTermQty > 0) {
						// Proportion of P&L that's from long-term holdings
						const proportion = longTermQty / totalQty;
						return sum + (parseFloat(h.pnl || '0') * proportion);
					}
					return sum;
				}, 0);

				// Calculate tax savings
				const holdingsForTax = allHoldings.map((h) => ({
					symbol: h.symbol,
					quantity: parseFloat(h.quantity || '0'),
					quantityLongTerm: parseFloat(h.quantity_long_term || '0'),
					averagePrice: parseFloat(h.average_price || '0'),
					currentPrice: parseFloat(h.current_price || '0'),
					pnl: parseFloat(h.pnl || '0'),
					pnlPercentage: parseFloat(h.pnl_percentage || '0'),
					holdingPeriodDays: h.holding_period_days,
					isLongTerm: parseFloat(h.quantity_long_term || '0') > 0,
					purchaseDate: h.purchase_date,
				}));

				const taxCalc = calculateTaxSavings(holdingsForTax);

				setStats({
					totalHoldings: allHoldings.length,
					longTermCount: longTermHoldings.length,
					totalPnl,
					longTermPnl,
					taxSavings: taxCalc.estimatedTaxSavings,
				});
			} catch (error) {
				console.error('Error fetching stats:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, [currentVault?.id, selectedUploadId]);

	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Loading...</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">-</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.totalHoldings}</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Long Term Holdings</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.longTermCount}</div>
					<p className="text-xs text-muted-foreground">
						{stats.totalHoldings > 0
							? ((stats.longTermCount / stats.totalHoldings) * 100).toFixed(1)
							: 0}
						% of total
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total P&L</CardTitle>
				</CardHeader>
				<CardContent>
					<div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
						<CurrencyCell value={stats.totalPnl} currency={user?.currency} locale={user?.locale} />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Est. Tax Savings</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-green-600">
						<CurrencyCell value={stats.taxSavings} currency={user?.currency} locale={user?.locale} />
					</div>
					<p className="text-xs text-muted-foreground">From long-term gains</p>
				</CardContent>
			</Card>
		</div>
	);
}

