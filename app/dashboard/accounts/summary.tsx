'use client';

import { useMemo } from 'react';

import SummaryCard from 'components/card/summary-card';
import { useAmountVisibility } from 'components/context/amount-visibility-provider';
import { useUser } from 'components/context/auth-provider';
import { useData } from 'components/context/data-provider';
import CardLoader from 'components/loader/card';

import { accountTypes } from 'constants/accounts';
import { formatCurrency } from 'lib/formatter';

export default function AccountsSummary() {
	const user = useUser();
	const { data = [], loading = true } = useData();
	const { showAmounts } = useAmountVisibility();

	const activeAccounts = useMemo(() => data.filter((account: any) => account.active), [data]);
	const totalBalance = useMemo(
		() => activeAccounts.reduce((acc: number, account: any) => acc + parseFloat(account.current_balance || '0'), 0),
		[activeAccounts]
	);

	const accountsByType = useMemo(
		() =>
			activeAccounts.reduce((acc: any, account: any) => {
				acc[account.type] = (acc[account.type] || 0) + 1;
				return acc;
			}, {}),
		[activeAccounts]
	);

	const negativeBalanceCount = useMemo(
		() => activeAccounts.filter((account: any) => parseFloat(account.current_balance || '0') < 0).length,
		[activeAccounts]
	);

	const accountsWithMembers = useMemo(
		() => activeAccounts.filter((account: any) => account.member_id).length,
		[activeAccounts]
	);

	const averageBalance = useMemo(
		() => (activeAccounts.length > 0 ? totalBalance / activeAccounts.length : 0),
		[activeAccounts.length, totalBalance]
	);

	const mostCommonType = useMemo(() => {
		const entries = Object.entries(accountsByType);
		if (entries.length === 0) return null;
		const sorted = entries.sort((a, b) => (b[1] as number) - (a[1] as number));
		const typeKey = sorted[0][0];
		return accountTypes[typeKey as keyof typeof accountTypes]?.name || typeKey;
	}, [accountsByType]);

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={6} className="mb-6" />
			) : (
				<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
					<SummaryCard title="total accounts" data={activeAccounts.length} />
					<SummaryCard
						title="total balance"
						isAmount={true}
						data={formatCurrency({
							value: totalBalance,
							currency: user?.currency,
							locale: user?.locale,
							showAmounts,
						})}
					/>
					<SummaryCard
						title="average balance"
						isAmount={true}
						data={formatCurrency({
							value: averageBalance,
							currency: user?.currency,
							locale: user?.locale,
							showAmounts,
						})}
					/>
					<SummaryCard title="disabled accounts" data={data.length - activeAccounts.length} />
					<SummaryCard title="negative balance" data={negativeBalanceCount} />
					<SummaryCard title="linked to members" data={accountsWithMembers} />
					{mostCommonType && (
						<SummaryCard title="most common type" data={mostCommonType} />
					)}
					<SummaryCard title="bank accounts" data={accountsByType.bank || 0} />
					<SummaryCard title="credit cards" data={accountsByType.credit_card || 0} />
				</div>
			)}
		</>
	);
}

