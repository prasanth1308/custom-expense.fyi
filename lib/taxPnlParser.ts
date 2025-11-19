import * as XLSX from 'xlsx';

export interface ParsedHolding {
	symbol: string;
	isin?: string;
	sector?: string;
	quantity: number;
	quantityLongTerm: number;
	averagePrice: number;
	currentPrice: number;
	pnl: number;
	pnlPercentage: number;
	holdingPeriodDays: number;
	isLongTerm: boolean;
	purchaseDate: string; // Estimated or actual purchase date
}

export interface ParseResult {
	holdings: ParsedHolding[];
	summary: {
		investedValue: number;
		presentValue: number;
		unrealizedPnl: number;
		unrealizedPnlPercentage: number;
	};
}

/**
 * Parse Kite holdings Excel file
 * @param fileBuffer - Buffer containing the Excel file
 * @param statementDate - Date of the holdings statement (for calculating holding period)
 * @returns Parsed holdings data
 */
export function parseKiteHoldings(
	fileBuffer: Buffer,
	statementDate?: Date
): ParseResult {
	const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames.find(
		(name) => name.toLowerCase().includes('equity') || name === 'Equity'
	);

	if (!sheetName) {
		throw new Error('Equity sheet not found in the file');
	}

	const worksheet = workbook.Sheets[sheetName];
	const data = XLSX.utils.sheet_to_json(worksheet, {
		header: 1,
		defval: '',
		raw: false,
	}) as any[][];

	// Find header row (contains "Symbol")
	let headerRowIndex = -1;
	let summaryRowIndex = -1;

	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		if (Array.isArray(row) && row[0] === 'Symbol') {
			headerRowIndex = i;
		}
		if (Array.isArray(row) && row[0] === 'Invested Value') {
			summaryRowIndex = i;
		}
	}

	if (headerRowIndex === -1) {
		throw new Error('Could not find header row in the file');
	}

	// Extract summary data
	const summary = {
		investedValue: 0,
		presentValue: 0,
		unrealizedPnl: 0,
		unrealizedPnlPercentage: 0,
	};

	if (summaryRowIndex !== -1) {
		const investedRow = data[summaryRowIndex];
		const presentRow = data[summaryRowIndex + 1];
		const pnlRow = data[summaryRowIndex + 2];
		const pnlPctRow = data[summaryRowIndex + 3];

		summary.investedValue = parseFloat(investedRow[1] || '0') || 0;
		summary.presentValue = parseFloat(presentRow[1] || '0') || 0;
		summary.unrealizedPnl = parseFloat(pnlRow[1] || '0') || 0;
		summary.unrealizedPnlPercentage = parseFloat(pnlPctRow[1] || '0') || 0;
	}

	// Extract headers
	const headers = data[headerRowIndex] as string[];
	const symbolIndex = headers.indexOf('Symbol');
	const isinIndex = headers.indexOf('ISIN');
	const sectorIndex = headers.indexOf('Sector');
	const quantityIndex = headers.indexOf('Quantity Available');
	const quantityLongTermIndex = headers.indexOf('Quantity Long Term');
	const avgPriceIndex = headers.indexOf('Average Price');
	const currentPriceIndex = headers.indexOf('Previous Closing Price');
	const pnlIndex = headers.indexOf('Unrealized P&L');
	const pnlPctIndex = headers.indexOf('Unrealized P&L Pct.');

	// Parse holdings
	const holdings: ParsedHolding[] = [];
	const today = statementDate || new Date();

	for (let i = headerRowIndex + 1; i < data.length; i++) {
		const row = data[i];
		if (!Array.isArray(row) || !row[symbolIndex] || row[symbolIndex] === '') {
			continue;
		}

		const symbol = String(row[symbolIndex] || '').trim();
		if (!symbol) continue;

		const quantity = parseFloat(row[quantityIndex] || '0') || 0;
		const quantityLongTerm = parseFloat(row[quantityLongTermIndex] || '0') || 0;
		const averagePrice = parseFloat(row[avgPriceIndex] || '0') || 0;
		const currentPrice = parseFloat(row[currentPriceIndex] || '0') || 0;
		const pnl = parseFloat(row[pnlIndex] || '0') || 0;
		const pnlPercentage = parseFloat(row[pnlPctIndex] || '0') || 0;

		// Skip if no quantity
		if (quantity === 0) continue;

		// Calculate holding period
		// If there are long-term shares, assume they've been held for >365 days
		// For short-term, we'll estimate based on average price vs current price
		// For simplicity, if quantityLongTerm > 0, we consider the holding as long-term eligible
		// We'll use a conservative estimate: if >50% of shares are long-term, mark as long-term
		const isLongTerm = quantityLongTerm > 0 && quantityLongTerm >= quantity * 0.5;

		// Estimate holding period: if long-term, use 400 days (conservative), else use 180 days
		// In a real scenario, you'd need actual purchase dates from transaction history
		const holdingPeriodDays = isLongTerm ? 400 : 180;

		// Estimate purchase date (for display purposes)
		const estimatedPurchaseDate = new Date(today);
		estimatedPurchaseDate.setDate(estimatedPurchaseDate.getDate() - holdingPeriodDays);

		holdings.push({
			symbol,
			isin: row[isinIndex] ? String(row[isinIndex]).trim() : undefined,
			sector: row[sectorIndex] ? String(row[sectorIndex]).trim() : undefined,
			quantity,
			quantityLongTerm,
			averagePrice,
			currentPrice,
			pnl,
			pnlPercentage,
			holdingPeriodDays,
			isLongTerm,
			purchaseDate: estimatedPurchaseDate.toISOString().split('T')[0],
		});
	}

	return {
		holdings,
		summary,
	};
}

/**
 * Calculate tax savings estimate for long-term holdings
 * In India, long-term capital gains (>1 year) on equity are tax-free up to 1 lakh, then 10% above that
 * @param holdings - Array of holdings
 * @returns Estimated tax savings
 */
export function calculateTaxSavings(holdings: ParsedHolding[]): {
	totalLongTermGains: number;
	estimatedTaxSavings: number;
	longTermHoldingsCount: number;
} {
	const longTermHoldings = holdings.filter((h) => h.isLongTerm && h.pnl > 0);
	const totalLongTermGains = longTermHoldings.reduce((sum, h) => sum + h.pnl, 0);

	// Tax exemption limit (1.25 lakh = 125,000 INR)
	const exemptionLimit = 125000;
	const taxableGains = Math.max(0, totalLongTermGains - exemptionLimit);
	const taxRate = 0.125; // 12.5% for LTCG above exemption
	const estimatedTaxSavings = taxableGains * taxRate;

	return {
		totalLongTermGains,
		estimatedTaxSavings,
		longTermHoldingsCount: longTermHoldings.length,
	};
}

