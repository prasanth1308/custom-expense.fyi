'use client';

import { useEffect } from 'react';
import { useUser } from 'components/context/auth-provider';

export function ColorSchemeProvider() {
	const user = useUser();

	useEffect(() => {
		if (!user?.color_scheme) return;

		const scheme = user.color_scheme;
		const html = document.documentElement;

		// Remove all color scheme classes
		html.className = html.className.replace(/color-scheme-\w+/g, '').replace(/\s+/g, ' ').trim();

		// Add the selected color scheme class
		if (scheme !== 'default') {
			html.classList.add(`color-scheme-${scheme}`);
		}
	}, [user?.color_scheme]);

	return null;
}

