import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://expense.fyi';

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: baseUrl,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/signin`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/signup`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/expenses`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/income`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/investments`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/subscriptions`,
			lastModified: new Date(),
		},
		{
			url: `${baseUrl}/settings`,
			lastModified: new Date(),
		},
	];
}
