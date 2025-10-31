import { DataContextProvider } from 'components/context/data-provider';
import LayoutHeader from 'components/layout/header';
import { getAppName } from 'lib/config';

import MembersSummary from './summary';
import MembersTable from './table';

const title = `${getAppName()} – Members`;
const description = 'Manage your family members.';

export const metadata = {
	title,
	description,
};

export default async function Page() {
	return (
		<>
			<LayoutHeader title="members" />
			<DataContextProvider name="members" isNotRange={true}>
				<div className="w-full overflow-x-auto p-4 pt-3">
					<MembersSummary />
					<MembersTable />
				</div>
			</DataContextProvider>
		</>
	);
}

