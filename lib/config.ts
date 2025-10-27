// Dynamic configuration for branding and domains
// This allows the app to work with any domain like solaiexp.vercel.app

interface AppConfig {
	// App branding
	name: string;
	shortName: string;
	tagline: string;
	description: string;
	
	// Domain configuration
	domain: string;
	baseUrl: string;
	
	// Contact information
	supportEmail: string;
	contactEmail: string;
	
	// Social links
	githubUrl: string;
	twitterUrl: string;
	
	// Author information
	authorName: string;
	authorTwitter: string;
}

// Get configuration based on environment
const getAppConfig = (): AppConfig => {
	const isProduction = process.env.NODE_ENV === 'production';
	
	// Get domain from environment or use current host
	const getDomain = () => {
		if (typeof window !== 'undefined') {
			// Client-side: use current host
			return window.location.host;
		}
		
		// Server-side: use environment variables or fallback
		if (isProduction) {
			return process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'expense.fyi';
		}
		
		// Local development
		const port = process.env.NEXT_PUBLIC_SITE_PORT || '3000';
		return `localhost:${port}`;
	};

	const domain = getDomain();
	const baseUrl = isProduction ? `https://${domain}` : `http://${domain}`;
	
	// Extract app name from domain (e.g., "solaiexp" from "solaiexp.vercel.app")
	const appName = domain.includes('.') ? domain.split('.')[0] : 'expense';
	const capitalizedAppName = appName.charAt(0).toUpperCase() + appName.slice(1);
	
	return {
		// App branding - customizable based on domain
		name: process.env.NEXT_PUBLIC_APP_NAME || `${capitalizedAppName}.fyi`,
		shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || capitalizedAppName,
		tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Track your expenses with ease',
		description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Effortlessly Track and Manage Expenses.',
		
		// Domain configuration
		domain,
		baseUrl,
		
		// Contact information
		supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${domain}`,
		contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || `hello@${domain}`,
		
		// Social links
		githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/gokulkrishh/expense.fyi',
		twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/gokul_i',
		
		// Author information
		authorName: process.env.NEXT_PUBLIC_AUTHOR_NAME || 'Gokul',
		authorTwitter: process.env.NEXT_PUBLIC_AUTHOR_TWITTER || '@gokul_i',
	};
};

// Export the configuration
export const appConfig = getAppConfig();

// Helper functions
export const getAppName = () => appConfig.name;
export const getAppShortName = () => appConfig.shortName;
export const getAppTagline = () => appConfig.tagline;
export const getAppDescription = () => appConfig.description;
export const getAppDomain = () => appConfig.domain;
export const getAppBaseUrl = () => appConfig.baseUrl;
export const getSupportEmail = () => appConfig.supportEmail;
export const getContactEmail = () => appConfig.contactEmail;
export const getGithubUrl = () => appConfig.githubUrl;
export const getTwitterUrl = () => appConfig.twitterUrl;
export const getAuthorName = () => appConfig.authorName;
export const getAuthorTwitter = () => appConfig.authorTwitter;

// URL generation helpers
export const getAppUrl = (path: string = '') => {
	const baseUrl = getAppBaseUrl();
	return path ? `${baseUrl}${path.startsWith('/') ? path : `/${path}`}` : baseUrl;
};

export const getApiUrl = (path: string = '') => {
	return getAppUrl(`/api${path.startsWith('/') ? path : `/${path}`}`);
};

export const getSigninUrl = () => getAppUrl('/signin');
export const getSignupUrl = () => getAppUrl('/signup');
export const getDashboardUrl = () => getAppUrl('/');

export default appConfig;

