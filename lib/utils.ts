import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import urls from 'constants/url';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const isProduction = process.env.NODE_ENV === 'production';

export const getRedirectUrl = () => {
	console.log('Getting redirect URL');
	// Use current domain for redirects to dashboard
	if (typeof window !== 'undefined') {
		return `${window.location.protocol}//${window.location.host}/dashboard`;
	}
	
	// Server-side fallback
	const siteUrl = process?.env?.NEXT_PUBLIC_SITE_URL || process?.env?.VERCEL_URL;
	
	if (siteUrl) {
		const cleanUrl = siteUrl.replace(/^https?:\/\//, '');
		const protocol = isProduction ? 'https://' : 'http://';
		return `${protocol}${cleanUrl}/dashboard`;
	}
	
	// Final fallback
	return isProduction ? 'https://solaiexp.vercel.app/dashboard' : 'http://localhost:3002/dashboard';
};
