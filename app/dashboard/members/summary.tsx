'use client';

import SummaryCard from 'components/card/summary-card';
import { useData } from 'components/context/data-provider';
import CardLoader from 'components/loader/card';

export default function MembersSummary() {
	const { data = [], loading = true } = useData();

	const activeMembers = data.filter((member: any) => member.active);
	const totalLinkedAccounts = activeMembers.reduce(
		(acc: number, member: any) => acc + (member.linked_accounts_count || 0),
		0
	);

	return (
		<>
			<h2 className="mb-4 font-semibold text-primary dark:text-white">Summary</h2>
			{loading ? (
				<CardLoader cards={3} className="mb-6" />
			) : (
				<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5">
					<SummaryCard title="total members" data={activeMembers.length} />
					<SummaryCard title="disabled members" data={data.length - activeMembers.length} />
					<SummaryCard title="linked accounts" data={totalLinkedAccounts} />
				</div>
			)}
		</>
	);
}

