import { DataContextProvider } from 'components/context/data-provider';
import LayoutHeader from 'components/layout/header';
import { getAppName } from 'lib/config';

import SubscriptionsSummary from './summary';
import SubscriptionsTable from './table';

const title = `${getAppName()} – Subscriptions`;
const description = 'Effortlessly Track and Manage Expenses.';

export const metadata = {
	title,
	description,
};

export default async function Page() {
	return (
		<>
			<LayoutHeader title="subscriptions" />
			<DataContextProvider name="subscriptions" isNotRange={true}>
				<div className="w-full overflow-x-auto p-4 pt-3">
					<SubscriptionsSummary />
					<SubscriptionsTable />
				</div>
			</DataContextProvider>
		</>
	);
}
