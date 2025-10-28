import { Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';

import './globals.css';
import './overwrites.css';
import { getAppName, getAppTagline, getAppBaseUrl } from 'lib/config';
import PWAProvider from 'components/pwa-provider';

const inter = Inter({ subsets: ['latin'] });

const title = `${getAppName()} – ${getAppTagline()}`;
const description = 'Effortlessly Track and Manage Expenses.';

const GOOGLE_ANALYTICS_ID = process.env.GA4_ANALYTICS_ID;

export const metadata = {
	title,
	description,
	manifest: `${getAppBaseUrl()}/manifest.json`,
	twitter: {
		card: 'summary_large_image',
		title,
		description,
		creator: '@gokul_i',
		images: [`${getAppBaseUrl()}/og.jpg`],
	},
	openGraph: {
		title,
		description,
		url: getAppBaseUrl(),
		type: 'website',
		images: [`${getAppBaseUrl()}/og.jpg`],
	},
	icons: {
		icon: `${getAppBaseUrl()}/icons/icon.svg`,
		shortcut: `${getAppBaseUrl()}/favicon.ico`,
		apple: `${getAppBaseUrl()}/icons/apple-icon.png`,
	},
	appleWebApp: {
		title,
		statusBarStyle: 'black',
		startupImage: [`${getAppBaseUrl()}/icons/apple-icon.png`],
	},
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	userScalable: false,
	themeColor: '#09090b',
	viewportFit: 'cover',
};

export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content={getAppName()} />
				<meta name="application-name" content={getAppName()} />
				<meta name="msapplication-TileColor" content="#09090b" />
				<meta name="msapplication-tap-highlight" content="no" />
				<link rel="apple-touch-icon" href="/icons/apple-icon.png" />
				<link rel="mask-icon" href="/icons/icon.svg" color="#09090b" />
			</head>
			<body className={`${inter.className} flex h-full flex-col text-gray-600 antialiased`}>
				<PWAProvider>
					{children}
				</PWAProvider>
				<SpeedInsights />
			</body>
			<Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`} strategy="afterInteractive" />
			<Script id="ga4" strategy="afterInteractive">
				{`
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());

						gtag('config', '${GOOGLE_ANALYTICS_ID}');
					`}
			</Script>
		</html>
	);
}
