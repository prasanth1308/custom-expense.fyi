'use client';

import Image from 'next/image';
import logo from 'public/icons/logo.svg';
import { getAppName } from 'lib/config';

interface LogoProps {
	width?: number;
	height?: number;
	className?: string;
	alt?: string;
	logoUrl?: string | null;
}

// Internal component that uses user context (only for authenticated pages)
function LogoWithUser({ width, height, className, alt, logoUrl: propLogoUrl }: LogoProps) {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { useUser } = require('components/context/auth-provider');
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const user = useUser();
	const userLogoUrl = user?.logo_url;
	const finalLogoUrl = propLogoUrl || userLogoUrl || logo;
	const logoAlt = alt || `${getAppName()} logo`;

	if (propLogoUrl || userLogoUrl) {
		return (
			<Image
				src={finalLogoUrl}
				width={width}
				height={height}
				alt={logoAlt}
				className={className}
				style={{ objectFit: 'contain' }}
			/>
		);
	}

	return <Image src={logo} width={width} height={height} alt={logoAlt} className={className} />;
}

export default function Logo(props: LogoProps) {
	// If logoUrl is explicitly provided, use it directly
	if (props.logoUrl) {
		const logoAlt = props.alt || `${getAppName()} logo`;
		return (
			<Image
				src={props.logoUrl}
				width={props.width || 50}
				height={props.height || 50}
				alt={logoAlt}
				className={props.className}
				style={{ objectFit: 'contain' }}
			/>
		);
	}

	// Try to use user context (works in authenticated pages)
	// For signin/signup pages, this will error and we'll catch it
	try {
		return <LogoWithUser {...props} />;
	} catch {
		// Auth context not available - use default logo
		const logoAlt = props.alt || `${getAppName()} logo`;
		return (
			<Image
				src={logo}
				width={props.width || 50}
				height={props.height || 50}
				alt={logoAlt}
				className={props.className}
			/>
		);
	}
}
