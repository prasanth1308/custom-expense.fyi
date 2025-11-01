'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AmountVisibilityContextType = {
	showAmounts: boolean;
	toggleAmounts: () => void;
};

const AmountVisibilityContext = createContext<AmountVisibilityContextType | null>(null);

const STORAGE_KEY = 'amount-visibility';

export const AmountVisibilityProvider = ({ children }: { children: React.ReactNode }) => {
	const [showAmounts, setShowAmounts] = useState(false);

	// Load from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) {
			setShowAmounts(stored === 'true');
		}
	}, []);

	// Save to localStorage when it changes
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, String(showAmounts));
	}, [showAmounts]);

	const toggleAmounts = () => {
		setShowAmounts((prev) => !prev);
	};

	return (
		<AmountVisibilityContext.Provider value={{ showAmounts, toggleAmounts }}>
			{children}
		</AmountVisibilityContext.Provider>
	);
};

export const useAmountVisibility = (): AmountVisibilityContextType => {
	const context = useContext(AmountVisibilityContext);
	if (context === null || context === undefined) {
		throw new Error('useAmountVisibility must be used within AmountVisibilityProvider');
	}
	return context;
};

