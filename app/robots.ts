import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'solaiexp.vercel.app' : 'localhost:3002');
	const isProduction = process.env.NODE_ENV === 'production';
	const protocol = isProduction ? 'https://' : 'http://';
	
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: '/private/',
		},
		sitemap: `${protocol}${baseUrl}/sitemap.xml`,
	};
}
