import { DataContextProvider } from 'components/context/data-provider';
import LayoutHeader from 'components/layout/header';
import { getAppName } from 'lib/config';

import AccountsSummary from './summary';
import AccountsTable from './table';

const title = `${getAppName()} – Accounts`;
const description = 'Manage your accounts.';

export const metadata = {
	title,
	description,
};

export default async function Page() {
	return (
		<>
			<LayoutHeader title="accounts" />
			<DataContextProvider name="accounts" isNotRange={true}>
				<div className="w-full overflow-x-auto p-4 pt-3">
					<AccountsSummary />
					<AccountsTable />
				</div>
			</DataContextProvider>
		</>
	);
}

