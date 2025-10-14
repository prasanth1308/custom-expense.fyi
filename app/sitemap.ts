import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'solaiexp.vercel.app' : 'localhost:3000');
	const isProduction = process.env.NODE_ENV === 'production';
	const protocol = isProduction ? 'https://' : 'http://';
	
	return [
		{
			url: `${protocol}${baseUrl}`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}/signin`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}/signup`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}/expenses`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}/income`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}/investments`,
			lastModified: new Date(),
		},
		{
			url: `${protocol}app.${baseUrl}/settings`,
			lastModified: new Date(),
		},
	];
}
