'use client';

import { useMemo } from 'react';

import SummaryCard from 'components/card/summary-card';
import { useData } from 'components/context/data-provider';
import CardLoader from 'components/loader/card';

export default function MembersSummary() {
	const { data = [], loading = true } = useData();

	const activeMembers = useMemo(() => data.filter((member: any) => member.active), [data]);
	const totalLinkedAccounts = useMemo(
		() => activeMembers.reduce((acc: number, member: any) => acc + (member.linked_accounts_count || 0), 0),
		[activeMembers]
	);

	const totalLinkedExpenses = useMemo(
		() => activeMembers.reduce((acc: number, member: any) => acc + (member.expenses_count || 0), 0),
		[activeMembers]
	);

	const totalLinkedIncome = useMemo(
		() => activeMembers.reduce((acc: number, member: any) => acc + (member.income_count || 0), 0),
		[activeMembers]
	);

	const membersWithAccounts = useMemo(
		() => activeMembers.filter((member: any) => (member.linked_accounts_count || 0) > 0).length,
		[activeMembers]
	);

	const membersWithTransactions = useMemo(
		() =>
			activeMembers.filter(
				(member: any) => (member.expenses_count || 0) > 0 || (member.income_count || 0) > 0
			).length,
		[activeMembers]
	);

	const averageAccountsPerMember = useMemo(
		() => (activeMembers.length > 0 ? (totalLinkedAccounts / activeMembers.length).toFixed(1) : '0'),
		[activeMembers.length, totalLinkedAccounts]
	);

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={7} className="mb-6" />
			) : (
				<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
					<SummaryCard title="total members" data={activeMembers.length} />
					<SummaryCard title="disabled members" data={data.length - activeMembers.length} />
					<SummaryCard title="linked accounts" data={totalLinkedAccounts} />
					<SummaryCard title="linked expenses" data={totalLinkedExpenses} />
					<SummaryCard title="linked income" data={totalLinkedIncome} />
					<SummaryCard title="members with accounts" data={membersWithAccounts} />
					<SummaryCard title="members with transactions" data={membersWithTransactions} />
					<SummaryCard title="avg accounts per member" data={averageAccountsPerMember} />
				</div>
			)}
		</>
	);
}

