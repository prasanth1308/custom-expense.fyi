'use client';

import SummaryCard from 'components/card/summary-card';
import { useUser } from 'components/context/auth-provider';
import { useData } from 'components/context/data-provider';
import CardLoader from 'components/loader/card';

import { formatCurrency } from 'lib/formatter';

export default function AccountsSummary() {
	const user = useUser();
	const { data = [], loading = true } = useData();

	const activeAccounts = data.filter((account: any) => account.active);
	const totalBalance = activeAccounts.reduce(
		(acc: number, account: any) => acc + parseFloat(account.current_balance || '0'),
		0
	);

	const accountsByType = activeAccounts.reduce((acc: any, account: any) => {
		acc[account.type] = (acc[account.type] || 0) + 1;
		return acc;
	}, {});

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={3} className="mb-6" />
			) : (
				<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
					<SummaryCard title="total accounts" data={activeAccounts.length} />
					<SummaryCard
						title="total balance"
						data={formatCurrency({
							value: totalBalance,
							currency: user?.currency,
							locale: user?.locale,
						})}
					/>
					<SummaryCard title="disabled accounts" data={data.length - activeAccounts.length} />
				</div>
			)}
		</>
	);
}

