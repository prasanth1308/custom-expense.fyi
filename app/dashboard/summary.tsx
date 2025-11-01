'use client';

import { useMemo } from 'react';

import { Banknote, Briefcase, CreditCard, MoveDownRight, MoveUpRight, PiggyBank, PlayIcon, Users, Wallet2 } from 'lucide-react';

import { useAmountVisibility } from 'components/context/amount-visibility-provider';
import { useUser } from 'components/context/auth-provider';
import { useOverview } from 'components/context/overview-provider';
import CardLoader from 'components/loader/card';
import { Badge } from 'components/ui/badge';

import { formatCurrency } from 'lib/formatter';
import { cn } from 'lib/utils';

import SummaryCard from '../../components/card/summary-card';

const Info = ({ value }: { value: number }) => {
	const isUp = value > 0;
	const Icon = isUp ? MoveUpRight : MoveDownRight;
	return (
		<Badge
			variant="secondary"
			className={`absolute bg-transparent tabular-nums font-semibold bottom-[5px] right-[5px] h-[18px] px-1 text-[10px] text-muted-foreground ${cn(
				{
					'text-green-600': isUp,
					'text-red-600': !isUp,
				}
			)}`}
		>
			<Icon className="mr-[0.5] h-[0.65rem] w-[0.65rem]" />
			{value}%
		</Badge>
	);
};

export default function Summary() {
	const user = useUser();
	const { data, loading } = useOverview();
	const { showAmounts } = useAmountVisibility();

	const totalExpenses = useMemo(
		() => (data.expenses || []).reduce((acc: any, { price }: any) => Number(price) + acc, 0),
		[data.expenses]
	);
	const totalIncome = useMemo(
		() => (data.income || []).reduce((acc: any, { price }: any) => Number(price) + acc, 0),
		[data.income]
	);
	const totalInvesments = useMemo(
		() => (data.investments || []).reduce((acc: any, { price, units }: any) => Number(price) * Number(units) + acc, 0),
		[data.investments]
	);
	const totalSubscriptions = useMemo(
		() => (data.subscriptions || []).reduce((acc: any, { price, paid_dates }: any) => Number(price) * (paid_dates?.length || 0) + acc, 0),
		[data.subscriptions]
	);
	const totalSpent = useMemo(() => totalExpenses + totalInvesments + totalSubscriptions, [totalExpenses, totalInvesments, totalSubscriptions]);
	const totalBalance = useMemo(() => totalIncome - totalSpent, [totalIncome, totalSpent]);

	// Accounts data
	const activeAccounts = useMemo(() => (data.accounts || []).filter((account: any) => account.active), [data.accounts]);
	const totalAccountsBalance = useMemo(
		() => activeAccounts.reduce((acc: number, account: any) => acc + parseFloat(account.current_balance || '0'), 0),
		[activeAccounts]
	);

	// Members data
	const activeMembers = useMemo(() => (data.members || []).filter((member: any) => member.active), [data.members]);

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={8} />
			) : (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8">
					<SummaryCard
						icon={Briefcase}
						title="total income"
						isAmount={true}
						data={formatCurrency({ value: totalIncome, currency: user.currency, locale: user.locale, showAmounts })}
					/>
					<SummaryCard
						icon={Wallet2}
						title="available balance"
						isAmount={true}
						data={formatCurrency({ value: totalBalance, currency: user.currency, locale: user.locale, showAmounts })}
					/>
					<SummaryCard
						icon={Banknote}
						title="total spent"
						tooltip="Total of expenses + investments + subscriptions"
						isAmount={true}
						data={formatCurrency({ value: totalSpent, currency: user.currency, locale: user.locale, showAmounts })}
					/>
					<SummaryCard
						icon={PiggyBank}
						title="total investment"
						isAmount={true}
						data={formatCurrency({ value: totalInvesments, currency: user.currency, locale: user.locale, showAmounts })}
					/>
					<SummaryCard
						icon={PlayIcon}
						title="total subscriptions"
						isAmount={true}
						data={formatCurrency({ value: totalSubscriptions, currency: user.currency, locale: user.locale, showAmounts })}
					/>
					<SummaryCard
						icon={CreditCard}
						title="total accounts"
						data={activeAccounts.length}
					/>
					<SummaryCard
						icon={Wallet2}
						title="total accounts balance"
						tooltip="Sum of all active account balances"
						isAmount={true}
						data={formatCurrency({ value: totalAccountsBalance, currency: user.currency, locale: user.locale, showAmounts })}
					/>
					<SummaryCard
						icon={Users}
						title="total members"
						data={activeMembers.length}
					/>
				</div>
			)}
		</>
	);
}
