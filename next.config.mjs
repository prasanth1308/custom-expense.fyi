const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	images: {
		domains: ['www.google.com'],
	},
	async headers() {
		return [
			// Apply security headers to all routes
			{ source: '/(.*)', headers: securityHeaders },
			// Apply no-cache headers to API routes
			{ source: '/api/(.*)', headers: apiHeaders },
		];
	},
};

const ContentSecurityPolicy = `
    default-src 'self' expense.fyi;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' app.lemonsqueezy.com *.cloudfront.net assets.lemonsqueezy.com *.googletagmanager.com;
    child-src 'self' expensefyi.lemonsqueezy.com;
    style-src 'self' 'unsafe-inline';
    img-src * blob: data:;
    media-src 'self';
    connect-src *;
    font-src 'self';
`;

const securityHeaders = [
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
	{
		key: 'Referrer-Policy',
		value: 'origin-when-cross-origin',
	},
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
	{
		key: 'Content-Security-Policy',
		value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
	},
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
	{
		key: 'X-Frame-Options',
		value: 'DENY',
	},
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
	{
		key: 'X-Content-Type-Options',
		value: 'nosniff',
	},
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
	{
		key: 'X-DNS-Prefetch-Control',
		value: 'on',
	},
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
	{
		key: 'Strict-Transport-Security',
		value: 'max-age=31536000; includeSubDomains; preload',
	},
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(self), geolocation=(), autoplay=()',
	},
	// Cache control for HTML pages - always revalidate
	{
		key: 'Cache-Control',
		value: 'public, max-age=0, must-revalidate',
	},
];

// Headers for API routes
const apiHeaders = [
	{
		key: 'Cache-Control',
		value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
	},
	{
		key: 'Pragma',
		value: 'no-cache',
	},
	{
		key: 'Expires',
		value: '0',
	},
];

export default nextConfig;
