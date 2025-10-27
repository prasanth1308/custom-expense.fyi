import { getRangeDateForFilter } from './date';
import { views } from './table';
import { getAppBaseUrl, getAppDomain, getTwitterUrl, getGithubUrl } from 'lib/config';

const isProduction = process.env.NODE_ENV === 'production';

// Get the current host URL dynamically
const getCurrentHost = () => {
	if (typeof window !== 'undefined') {
		// Client-side: use current host
		return window.location.origin;
	}
	
	// Server-side: use environment variables or fallback
	if (isProduction) {
		return process.env.NEXT_PUBLIC_SITE_URL || getAppBaseUrl();
	}
	
	// Local development
	const port = process.env.NEXT_PUBLIC_SITE_PORT || '3000';
	return `http://localhost:${port}`;
};

const domain = getAppDomain();
const local = `localhost:${process.env.NEXT_PUBLIC_SITE_PORT || '3000'}`;
const home = isProduction ? domain : local;

const url = {
	homeWithoutApp: home,
	home: `//${home}`,
	api: `${isProduction ? 'https://' : 'http://'}${home}`,
	serverApi: `${isProduction ? 'https://' : 'http://'}${home}`,
	app: {
		signin: `//${home}/signin`,
		signup: `//${home}/signup`,
		overview: `//${home}`,
	},
	twitter: getTwitterUrl(),
	github: getGithubUrl(),
};

export const getApiUrl = (filterKey: string, apiPath: string, categories: string[] = [], isNotRange = false) => {
	if (isNotRange) {
		return `/api/${apiPath}`;
	}

	if (filterKey === views.all.key) {
		return `/api/${apiPath}?categories=${categories?.join(',')}`;
	}

	const [start, end] = getRangeDateForFilter(filterKey);
	return `/api/${apiPath}?from=${start}&to=${end}&categories=${categories?.join(',')}`;
};

export default url;
