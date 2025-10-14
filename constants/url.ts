import { getRangeDateForFilter } from './date';
import { views } from './table';

const isProduction = process.env.NODE_ENV === 'production';

// Get the base domain from environment variable or fallback to Vercel URL
const getBaseDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.host;
  }
  
  // Server-side: check environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (siteUrl) {
    return siteUrl.replace(/^https?:\/\//, '');
  }
  
  // Fallback
  return isProduction ? 'solaiexp.vercel.app' : 'localhost:3002';
};

const baseDomain = getBaseDomain();
const protocol = isProduction ? 'https://' : 'http://';

const url = {
	homeWithoutApp: baseDomain,
	home: `${protocol}${baseDomain}`,
	api: `${protocol}${baseDomain}`,
	serverApi: `${protocol}${baseDomain}`,
	app: {
		signin: '/signin',
		signup: '/signup',
		overview: '/',
	},
	twitter: 'https://twitter.com/gokul_i',
	github: 'https://github.com/gokulkrishh/expense.fyi',
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
