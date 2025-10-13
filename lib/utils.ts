import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import urls from 'constants/url';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const isProduction = process.env.NODE_ENV === 'production';

export const getRedirectUrl = () => {
	const siteUrl = process?.env?.NEXT_PUBLIC_SITE_URL || process?.env?.VERCEL_URL;
	
	if (!siteUrl) {
		return isProduction ? 'https://app.solaiexp.vercel.app/' : 'http://app.localhost:3000/';
	}
	
	// Clean the URL (remove protocol if present)
	const cleanUrl = siteUrl.replace(/^https?:\/\//, '');
	
	// Build the URL with proper protocol and subdomain
	let url = isProduction 
		? `https://app.${cleanUrl}` 
		: `http://app.${cleanUrl}`;
	
	// Make sure to include trailing `/`.
	url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
	return url;
};
