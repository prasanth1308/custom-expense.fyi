'use client';

import { useMemo } from 'react';

import SummaryCard from 'components/card/summary-card';
import { useAmountVisibility } from 'components/context/amount-visibility-provider';
import { useUser } from 'components/context/auth-provider';
import { useData } from 'components/context/data-provider';
import CardLoader from 'components/loader/card';

import { formatCurrency } from 'lib/formatter';

export default function SubscriptionsSummary() {
	const user = useUser();
	const { data = [], loading = true } = useData();
	const { showAmounts } = useAmountVisibility();
	const monthlyData = useMemo(() => data.filter((datum: any) => datum.active && datum.paid === 'monthly'), [data]);
	const yearlyData = useMemo(() => data.filter((datum: any) => datum.active && datum.paid === 'yearly'), [data]);

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={4} className="mb-6" />
			) : (
				<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
					<SummaryCard title="total subscriptions" data={data.length} />
					<SummaryCard
						title="Active - Cancelled"
						data={`${data.filter((datum: any) => datum.active).length} - ${
							data.filter((datum: any) => !datum.active).length
						}`}
					/>
					<SummaryCard
						title="Total Active - Monthly"
						isAmount={true}
						data={formatCurrency({
							value: monthlyData.reduce((acc: any, datum: any) => Number(datum.price) + acc, 0),
							currency: user.currency,
							locale: user.locale,
							showAmounts,
						})}
					/>

					<SummaryCard
						title="Total Active - Yearly"
						isAmount={true}
						data={formatCurrency({
							value: yearlyData.reduce((acc: any, datum: any) => Number(datum.price) + acc, 0),
							currency: user.currency,
							locale: user.locale,
							showAmounts,
						})}
					/>
				</div>
			)}
		</>
	);
}
