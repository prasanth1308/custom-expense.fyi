'use client';

import { useAmountVisibility } from 'components/context/amount-visibility-provider';

import { formatCurrency } from 'lib/formatter';

type CurrencyCellProps = {
	value: number;
	currency?: string;
	locale?: string;
	className?: string;
};

export default function CurrencyCell({ value, currency, locale, className = 'font-medium tabular-nums' }: CurrencyCellProps) {
	const { showAmounts } = useAmountVisibility();
	const formatted = formatCurrency({ value, currency, locale, showAmounts });
	return <div className={className}>{formatted}</div>;
}

