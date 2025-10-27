import { getAppName } from 'lib/config';

const title = `${getAppName()} – Privacy Policy`;
const description = 'Effortlessly Track and Manage Expenses.';

export const metadata = {
	title,
	description,
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
