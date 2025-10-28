import { MetadataRoute } from 'next';
import { getAppName, getAppBaseUrl, getAppDescription } from 'lib/config';

export default function manifest(): MetadataRoute.Manifest {
	return {
		short_name: getAppName(),
		name: getAppName(),
		description: getAppDescription(),
		display: 'standalone',
		orientation: 'portrait-primary',
		scope: '/',
		start_url: `${getAppBaseUrl()}/?utm_source=homescreen`,
		theme_color: '#09090b',
		background_color: '#ffffff',
		categories: ['finance', 'productivity', 'utilities'],
		lang: 'en',
		dir: 'ltr',
		icons: [
			{
				src: '/icons/android-chrome-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable'
			},
			{
				src: '/icons/android-chrome-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			},
			{
				src: '/icons/apple-icon.png',
				sizes: '180x180',
				type: 'image/png'
			}
		],
		shortcuts: [
			{
				name: 'Add Expense',
				short_name: 'Add Expense',
				description: 'Quickly add a new expense',
				url: '/dashboard/expenses/add',
				icons: [
					{
						src: '/icons/android-chrome-192x192.png',
						sizes: '192x192'
					}
				]
			},
			{
				name: 'View Dashboard',
				short_name: 'Dashboard',
				description: 'View your expense dashboard',
				url: '/dashboard',
				icons: [
					{
						src: '/icons/android-chrome-192x192.png',
						sizes: '192x192'
					}
				]
			}
		],
		prefer_related_applications: false
	};
}
