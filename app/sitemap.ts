import { MetadataRoute } from 'next';
import { getAppBaseUrl } from 'lib/config';

const baseUrl = getAppBaseUrl();

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
