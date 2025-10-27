import { DataContextProvider } from 'components/context/data-provider';
import LayoutHeader from 'components/layout/header';
import { getAppName } from 'lib/config';

import InvestmentsSummary from './summary';
import DataTable from './table';

const title = `${getAppName()} – Investments`;
const description = 'Effortlessly Track and Manage Expenses.';

export const metadata = {
	title,
	description,
};

export default async function Page() {
	return (
		<>
			<LayoutHeader title="investments" />
			<DataContextProvider name="investments">
				<div className="w-full overflow-x-auto p-4 pt-3">
					<InvestmentsSummary />
					<DataTable />
				</div>
			</DataContextProvider>
		</>
	);
}
