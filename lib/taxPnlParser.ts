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

export interface LtcgTransaction {
	symbol: string;
	date: string;
	amount: number; // positive for gains, negative for losses
	quantity: number;
	buyPrice?: number;
	sellPrice?: number;
	holdingPeriodDays?: number;
}

export interface MatchedPair {
	gain: LtcgTransaction;
	loss: LtcgTransaction;
	matchedAmount: number;
	remainingGain?: number;
	remainingLoss?: number;
}

export interface LtcgParseResult {
	ltcgTransactions: LtcgTransaction[];
	summary: {
		totalGains: number;
		totalLosses: number;
		netLtcg: number;
	};
}

export interface ComparisonResult {
	file1: {
		transactions: LtcgTransaction[];
		totalGains: number;
		totalLosses: number;
		netLtcg: number;
	};
	file2: {
		transactions: LtcgTransaction[];
		totalGains: number;
		totalLosses: number;
		netLtcg: number;
	};
	matchedPairs: MatchedPair[];
	unmatchedGains: LtcgTransaction[];
	unmatchedLosses: LtcgTransaction[];
	summary: {
		totalMatched: number;
		netLtcgAfterMatching: number;
		taxSavingsEstimate: number;
	};
}

/**
 * Parse Kite P&L export or Holdings Excel file to extract LTCG transactions
 * Supports both P&L format (realized gains/losses) and Holdings format (unrealized LTCG)
 * @param fileBuffer - Buffer or ArrayBuffer containing the Excel file
 * @returns Parsed LTCG transactions
 */
export function parseKitePnl(fileBuffer: Buffer | ArrayBuffer): LtcgParseResult {
	// XLSX can work with both Buffer (Node.js) and ArrayBuffer (browser)
	const workbook = XLSX.read(fileBuffer, { type: fileBuffer instanceof ArrayBuffer ? 'array' : 'buffer' });
	
	if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
		throw new Error('No sheets found in the Excel file');
	}

	// Try to find P&L sheet or Equity/Holdings sheet
	let sheetName = workbook.SheetNames.find(
		(name) =>
			name.toLowerCase().includes('p&l') ||
			name.toLowerCase().includes('pnl') ||
			name.toLowerCase().includes('profit') ||
			name.toLowerCase().includes('realized') ||
			name === 'P&L' ||
			name === 'Realized P&L' ||
			name.toLowerCase().includes('equity') ||
			name === 'Equity'
	);
	
	// If not found, try all sheets to find one with Symbol column
	if (!sheetName) {
		for (const name of workbook.SheetNames) {
			const testSheet = workbook.Sheets[name];
			const testData = XLSX.utils.sheet_to_json(testSheet, {
				header: 1,
				defval: '',
				raw: false,
			}) as any[][];
			
			// Check first few rows for Symbol column
			for (let i = 0; i < Math.min(5, testData.length); i++) {
				const row = testData[i];
				if (Array.isArray(row)) {
					const rowStr = row.map((cell) => String(cell || '').toLowerCase()).join(' ');
					if (rowStr.includes('symbol')) {
						sheetName = name;
						break;
					}
				}
			}
			if (sheetName) break;
		}
	}
	
	// Final fallback to first sheet
	if (!sheetName) {
		sheetName = workbook.SheetNames[0];
	}

	const worksheet = workbook.Sheets[sheetName];
	const data = XLSX.utils.sheet_to_json(worksheet, {
		header: 1,
		defval: '',
		raw: false,
	}) as any[][];

	// Find header row - look for rows containing "symbol" (most critical column)
	// Also check for P&L related terms but make them optional for flexibility
	let headerRowIndex = -1;
	for (let i = 0; i < Math.min(30, data.length); i++) {
		const row = data[i];
		if (Array.isArray(row)) {
			const rowStr = row.map((cell) => String(cell || '').toLowerCase()).join(' ');
			const hasSymbol = rowStr.includes('symbol');
			const hasPnlTerms = rowStr.includes('pnl') || rowStr.includes('profit') || rowStr.includes('gain') || rowStr.includes('loss') || rowStr.includes('realized');
			
			// Primary: Look for symbol + P&L terms
			// Fallback: Just look for symbol (more flexible)
			if (hasSymbol && (hasPnlTerms || i < 5)) {
				// Verify this row has enough non-empty cells to be a header
				const nonEmptyCells = row.filter((cell) => String(cell || '').trim() !== '').length;
				if (nonEmptyCells >= 3) {
					headerRowIndex = i;
					break;
				}
			}
		}
	}

	if (headerRowIndex === -1) {
		// Provide more helpful error message
		const sampleRows = data.slice(0, 5).map((row, idx) => 
			Array.isArray(row) ? row.slice(0, 5).map(cell => String(cell || '').substring(0, 20)).join(', ') : 'Invalid row'
		).join(' | ');
		throw new Error(
			`Could not find header row in the P&L file. ` +
			`Expected a row with "Symbol" column. ` +
			`First few rows: ${sampleRows.substring(0, 200)}...`
		);
	}

	// Extract headers
	const headers = data[headerRowIndex] as string[];
	const headerNames = headers.map((h) => String(h || '').trim()).join(', ');
	
	const symbolIndex = headers.findIndex((h) =>
		String(h || '').toLowerCase().includes('symbol')
	);
	const dateIndex = headers.findIndex(
		(h) =>
			String(h || '').toLowerCase().includes('date') ||
			String(h || '').toLowerCase().includes('settlement')
	);
	// Check for holdings format columns (Total Qty, LT Qty, CMP)
	// Support both exact column names and variations
	const totalQtyIndex = headers.findIndex((h) => {
		const hLower = String(h || '').toLowerCase().trim();
		return hLower === 'total qty' || hLower === 'total quantity' ||
			(hLower.includes('total') && (hLower.includes('qty') || hLower.includes('quantity'))) ||
			hLower === 'quantity available'; // Fallback to existing column name
	});
	const ltQtyIndex = headers.findIndex((h) => {
		const hLower = String(h || '').toLowerCase().trim();
		return hLower === 'lt qty' || hLower === 'lt quantity' || hLower === 'long term qty' || hLower === 'long term quantity' ||
			(hLower.includes('lt') || hLower.includes('long term')) && (hLower.includes('qty') || hLower.includes('quantity')) ||
			hLower === 'quantity long term'; // Fallback to existing column name
	});
	const cmpIndex = headers.findIndex((h) => {
		const hLower = String(h || '').toLowerCase().trim();
		return hLower === 'cmp' || hLower === 'current market price' || hLower === 'current price' || 
			hLower === 'previous closing price' || hLower.includes('previous closing price') ||
			hLower.includes('last price') || hLower.includes('closing price');
	});
	const avgPriceIndex = headers.findIndex((h) => {
		const hLower = String(h || '').toLowerCase().trim();
		return hLower === 'average price' || hLower === 'avg price' || hLower === 'purchase price' ||
			hLower.includes('average price') || hLower.includes('avg price');
	});
	
	const quantityIndex = headers.findIndex((h) =>
		String(h || '').toLowerCase().includes('quantity') || String(h || '').toLowerCase().includes('qty')
	);
	const pnlIndex = headers.findIndex(
		(h) =>
			String(h || '').toLowerCase().includes('pnl') ||
			String(h || '').toLowerCase().includes('profit') ||
			String(h || '').toLowerCase().includes('gain') ||
			String(h || '').toLowerCase().includes('loss') ||
			String(h || '').toLowerCase().includes('realized p&l') ||
			String(h || '').toLowerCase().includes('realized profit')
	);
	
	// Determine if this is a holdings format (has LT Qty and CMP) vs P&L format
	const isHoldingsFormat = (ltQtyIndex !== -1 && cmpIndex !== -1) || (totalQtyIndex !== -1 && ltQtyIndex !== -1);
	const buyPriceIndex = headers.findIndex(
		(h) => String(h || '').toLowerCase().includes('buy') && String(h || '').toLowerCase().includes('price')
	);
	const sellPriceIndex = headers.findIndex(
		(h) => String(h || '').toLowerCase().includes('sell') && String(h || '').toLowerCase().includes('price')
	);
	const holdingPeriodIndex = headers.findIndex(
		(h) =>
			String(h || '').toLowerCase().includes('holding') ||
			String(h || '').toLowerCase().includes('period') ||
			String(h || '').toLowerCase().includes('days') ||
			String(h || '').toLowerCase().includes('duration')
	);
	const typeIndex = headers.findIndex(
		(h) => {
			const hLower = String(h || '').toLowerCase();
			return (
				hLower.includes('type') ||
				hLower.includes('term') ||
				hLower.includes('lt') ||
				hLower.includes('st') ||
				hLower.includes('long term') ||
				hLower.includes('short term') ||
				hLower === 'lt' ||
				hLower === 'st' ||
				hLower === 'l/t' ||
				hLower === 's/t'
			);
		}
	);
	// Also check for columns that might indicate buy/sell dates to calculate holding period
	const buyDateIndex = headers.findIndex(
		(h) => {
			const hLower = String(h || '').toLowerCase();
			return (
				(hLower.includes('buy') && hLower.includes('date')) ||
				hLower.includes('purchase date') ||
				hLower.includes('entry date')
			);
		}
	);
	const sellDateIndex = headers.findIndex(
		(h) => {
			const hLower = String(h || '').toLowerCase();
			return (
				(hLower.includes('sell') && hLower.includes('date')) ||
				hLower.includes('exit date') ||
				hLower.includes('transaction date')
			);
		}
	);

	// Validate required columns
	if (symbolIndex === -1) {
		throw new Error(
			`Required column "Symbol" not found in the file. ` +
			`Found columns: ${headerNames || 'None'}`
		);
	}
	
	// For holdings format, we need LT Qty and CMP/Average Price
	// For P&L format, we need P&L column
	if (isHoldingsFormat) {
		if (ltQtyIndex === -1) {
			throw new Error(
				`Holdings format detected but "LT Qty" or "Long Term Quantity" column not found. ` +
				`Found columns: ${headerNames || 'None'}`
			);
		}
		if (cmpIndex === -1 && avgPriceIndex === -1) {
			throw new Error(
				`Holdings format detected but "CMP" or "Average Price" column not found. ` +
				`Found columns: ${headerNames || 'None'}`
			);
		}
	} else if (pnlIndex === -1) {
		throw new Error(
			`Required column "P&L" (or Profit/Gain/Loss) not found in the file. ` +
			`Found columns: ${headerNames || 'None'}`
		);
	}

	// Parse transactions
	const transactions: LtcgTransaction[] = [];
	const today = new Date();

	// Handle holdings format (similar to parseKiteHoldings)
	if (isHoldingsFormat) {
		// For holdings format, calculate LTCG from LT Qty, CMP, and Average Price
		for (let i = headerRowIndex + 1; i < data.length; i++) {
			const row = data[i];
			if (!Array.isArray(row) || !row[symbolIndex] || String(row[symbolIndex] || '').trim() === '') {
				continue;
			}

			const symbol = String(row[symbolIndex] || '').trim();
			if (!symbol) continue;

			// Get LT Qty (use totalQtyIndex or quantityIndex as fallback)
			const ltQty = ltQtyIndex !== -1 
				? parseFloat(String(row[ltQtyIndex] || '0').replace(/,/g, '')) || 0
				: 0;
			
			// Skip if no LT quantity
			if (ltQty === 0) continue;

			// Get CMP (Current Market Price) and Average Price
			const cmp = cmpIndex !== -1 
				? parseFloat(String(row[cmpIndex] || '0').replace(/,/g, '')) || 0
				: 0;
			const avgPrice = avgPriceIndex !== -1
				? parseFloat(String(row[avgPriceIndex] || '0').replace(/,/g, '')) || 0
				: 0;

			// Skip if prices are missing
			if (cmp === 0 || avgPrice === 0) continue;

			// Calculate LTCG: (CMP - Average Price) * LT Qty
			const ltcgAmount = (cmp - avgPrice) * ltQty;

			// Skip if LTCG is zero
			if (ltcgAmount === 0) continue;

			// Get quantity for display (use total qty if available, otherwise use LT qty)
			const quantity = totalQtyIndex !== -1
				? parseFloat(String(row[totalQtyIndex] || '0').replace(/,/g, '')) || ltQty
				: ltQty;

			// Parse date if available
			let dateStr = '';
			if (dateIndex !== -1 && row[dateIndex]) {
				const dateValue = row[dateIndex];
				if (dateValue instanceof Date) {
					dateStr = dateValue.toISOString().split('T')[0];
				} else {
					try {
						const parsed = new Date(String(dateValue));
						if (!isNaN(parsed.getTime())) {
							dateStr = parsed.toISOString().split('T')[0];
						} else {
							dateStr = today.toISOString().split('T')[0];
						}
					} catch {
						dateStr = today.toISOString().split('T')[0];
					}
				}
			} else {
				dateStr = today.toISOString().split('T')[0];
			}

			transactions.push({
				symbol,
				date: dateStr,
				amount: ltcgAmount, // positive for gains, negative for losses
				quantity: ltQty,
				buyPrice: avgPrice,
				sellPrice: cmp,
				holdingPeriodDays: 400, // Assume >365 days for LT holdings
			});
		}
	} else {
		// Handle P&L format (realized gains/losses)
		// If sheet name suggests it's a P&L or realized gains file, be more inclusive
		const isPnlSheet = sheetName.toLowerCase().includes('pnl') || 
			sheetName.toLowerCase().includes('profit') || 
			sheetName.toLowerCase().includes('realized') ||
			sheetName.toLowerCase().includes('gain') ||
			sheetName.toLowerCase().includes('loss');

		for (let i = headerRowIndex + 1; i < data.length; i++) {
			const row = data[i];
			if (!Array.isArray(row) || !row[symbolIndex] || String(row[symbolIndex] || '').trim() === '') {
				continue;
			}

			const symbol = String(row[symbolIndex] || '').trim();
			if (!symbol) continue;

			const pnlValue = parseFloat(String(row[pnlIndex] || '0').replace(/,/g, '')) || 0;
			
			// Skip if P&L is zero
			if (pnlValue === 0) continue;

		// Check if it's long-term using multiple methods
		let isLongTerm = false;
		let holdingPeriodDays: number | undefined = undefined;

		// Method 1: Check holding period column
		if (holdingPeriodIndex !== -1 && row[holdingPeriodIndex]) {
			holdingPeriodDays = parseFloat(String(row[holdingPeriodIndex] || '0').replace(/,/g, '')) || 0;
			isLongTerm = holdingPeriodDays > 365;
		}
		// Method 2: Check type/term column
		else if (typeIndex !== -1 && row[typeIndex]) {
			const type = String(row[typeIndex] || '').toLowerCase().trim();
			isLongTerm = 
				type.includes('lt') || 
				type.includes('long') || 
				type.includes('long-term') ||
				type === 'l' ||
				type === 'l/t' ||
				type.startsWith('l');
		}
		// Method 3: Calculate from buy/sell dates if available
		else if (buyDateIndex !== -1 && sellDateIndex !== -1 && row[buyDateIndex] && row[sellDateIndex]) {
			try {
				const buyDate = new Date(String(row[buyDateIndex]));
				const sellDate = new Date(String(row[sellDateIndex]));
				if (!isNaN(buyDate.getTime()) && !isNaN(sellDate.getTime())) {
					holdingPeriodDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
					isLongTerm = holdingPeriodDays > 365;
				}
			} catch (e) {
				// Date parsing failed, continue to next method
			}
		}
		// Method 4: If we have a date column, try to infer from transaction date vs current date
		else if (dateIndex !== -1 && row[dateIndex]) {
			try {
				const transactionDate = new Date(String(row[dateIndex]));
				if (!isNaN(transactionDate.getTime())) {
					// If transaction is older than 1 year, might be long-term (conservative approach)
					// But this is not reliable, so we'll be more lenient
					const daysSinceTransaction = Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
					// If transaction is very old (>2 years), likely long-term
					if (daysSinceTransaction > 730) {
						isLongTerm = true;
						holdingPeriodDays = daysSinceTransaction;
					}
				}
			} catch (e) {
				// Date parsing failed
			}
		}

		// If we still can't determine, be more inclusive based on context
		// In Kite P&L exports, if it's in the P&L file, it's likely a realized transaction
		if (!isLongTerm && holdingPeriodDays === undefined) {
			// If this is clearly a P&L sheet, include all transactions
			// User can manually verify if needed
			if (isPnlSheet) {
				isLongTerm = true; // Include it, let user verify
				holdingPeriodDays = 400; // Conservative estimate for display
			}
			// Also check if P&L value is significant (likely a realized transaction)
			else if (Math.abs(pnlValue) > 100) {
				// For significant amounts, assume it might be LTCG
				isLongTerm = true;
				holdingPeriodDays = 400;
			}
		}

		// Only include long-term transactions
		if (!isLongTerm) {
			continue;
		}

		const quantity = parseFloat(String(row[quantityIndex] || '0').replace(/,/g, '')) || 0;
		const buyPrice = buyPriceIndex !== -1 ? parseFloat(String(row[buyPriceIndex] || '0').replace(/,/g, '')) : undefined;
		const sellPrice = sellPriceIndex !== -1 ? parseFloat(String(row[sellPriceIndex] || '0').replace(/,/g, '')) : undefined;
		// Use calculated holdingPeriodDays if available, otherwise read from row
		if (holdingPeriodDays === undefined && holdingPeriodIndex !== -1) {
			holdingPeriodDays = parseFloat(String(row[holdingPeriodIndex] || '0').replace(/,/g, '')) || undefined;
		}

		// Parse date
		let dateStr = '';
		if (dateIndex !== -1 && row[dateIndex]) {
			const dateValue = row[dateIndex];
			if (dateValue instanceof Date) {
				dateStr = dateValue.toISOString().split('T')[0];
			} else {
				// Try to parse as date string
				const parsed = new Date(String(dateValue));
				if (!isNaN(parsed.getTime())) {
					dateStr = parsed.toISOString().split('T')[0];
				} else {
					dateStr = String(dateValue);
				}
			}
		} else {
			dateStr = today.toISOString().split('T')[0];
		}

			transactions.push({
				symbol,
				date: dateStr,
				amount: pnlValue, // positive for gains, negative for losses
				quantity,
				buyPrice,
				sellPrice,
				holdingPeriodDays,
			});
		}
	}

	// Calculate summary
	const totalGains = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
	const totalLosses = Math.abs(
		transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
	);
	const netLtcg = totalGains - totalLosses;

	return {
		ltcgTransactions: transactions,
		summary: {
			totalGains,
			totalLosses,
			netLtcg,
		},
	};
}

/**
 * Match LTCG transactions from two files by amount (regardless of symbol)
 * @param file1Transactions - LTCG transactions from first file
 * @param file2Transactions - LTCG transactions from second file
 * @returns Comparison result with matched pairs and unmatched items
 */
export function matchLtcgTransactions(
	file1Transactions: LtcgTransaction[],
	file2Transactions: LtcgTransaction[]
): ComparisonResult {
	// Separate gains and losses from both files
	const file1Gains = file1Transactions.filter((t) => t.amount > 0);
	const file1Losses = file1Transactions.filter((t) => t.amount < 0);
	const file2Gains = file2Transactions.filter((t) => t.amount > 0);
	const file2Losses = file2Transactions.filter((t) => t.amount < 0);

	// Sort gains descending, losses ascending (most negative first)
	file1Gains.sort((a, b) => b.amount - a.amount);
	file1Losses.sort((a, b) => a.amount - b.amount);
	file2Gains.sort((a, b) => b.amount - a.amount);
	file2Losses.sort((a, b) => a.amount - b.amount);

	// Create copies for matching (to track remaining amounts)
	const availableGains: Array<{ transaction: LtcgTransaction; remaining: number; source: 'file1' | 'file2' }> = [
		...file1Gains.map((t) => ({ transaction: t, remaining: t.amount, source: 'file1' as const })),
		...file2Gains.map((t) => ({ transaction: t, remaining: t.amount, source: 'file2' as const })),
	].sort((a, b) => b.remaining - a.remaining);

	const availableLosses: Array<{ transaction: LtcgTransaction; remaining: number; source: 'file1' | 'file2' }> = [
		...file1Losses.map((t) => ({ transaction: t, remaining: Math.abs(t.amount), source: 'file1' as const })),
		...file2Losses.map((t) => ({ transaction: t, remaining: Math.abs(t.amount), source: 'file2' as const })),
	].sort((a, b) => b.remaining - a.remaining);

	const matchedPairs: MatchedPair[] = [];
	const tolerance = 0.01; // Allow small rounding differences

	// Match gains with losses
	for (let i = 0; i < availableGains.length; i++) {
		const gainItem = availableGains[i];
		if (gainItem.remaining <= tolerance) continue;

		// Find best matching loss (closest amount)
		let bestMatchIndex = -1;
		let bestMatchDiff = Infinity;

		for (let j = 0; j < availableLosses.length; j++) {
			const lossItem = availableLosses[j];
			if (lossItem.remaining <= tolerance) continue;

			// Only match if from different files
			if (gainItem.source === lossItem.source) continue;

			const diff = Math.abs(gainItem.remaining - lossItem.remaining);
			if (diff < bestMatchDiff) {
				bestMatchDiff = diff;
				bestMatchIndex = j;
			}
		}

		if (bestMatchIndex !== -1) {
			const lossItem = availableLosses[bestMatchIndex];
			const matchedAmount = Math.min(gainItem.remaining, lossItem.remaining);

			// Create matched pair
			matchedPairs.push({
				gain: gainItem.transaction,
				loss: lossItem.transaction,
				matchedAmount,
				remainingGain: gainItem.remaining - matchedAmount > tolerance ? gainItem.remaining - matchedAmount : undefined,
				remainingLoss: lossItem.remaining - matchedAmount > tolerance ? lossItem.remaining - matchedAmount : undefined,
			});

			// Update remaining amounts
			gainItem.remaining -= matchedAmount;
			lossItem.remaining -= matchedAmount;
		}
	}

	// Collect unmatched items
	const unmatchedGains: LtcgTransaction[] = [];
	const unmatchedLosses: LtcgTransaction[] = [];

	availableGains.forEach((item) => {
		if (item.remaining > tolerance) {
			// Create a copy with adjusted amount
			unmatchedGains.push({
				...item.transaction,
				amount: item.remaining,
			});
		}
	});

	availableLosses.forEach((item) => {
		if (item.remaining > tolerance) {
			// Create a copy with adjusted amount (negative)
			unmatchedLosses.push({
				...item.transaction,
				amount: -item.remaining,
			});
		}
	});

	// Calculate file summaries
	const file1TotalGains = file1Gains.reduce((sum, t) => sum + t.amount, 0);
	const file1TotalLosses = Math.abs(file1Losses.reduce((sum, t) => sum + t.amount, 0));
	const file2TotalGains = file2Gains.reduce((sum, t) => sum + t.amount, 0);
	const file2TotalLosses = Math.abs(file2Losses.reduce((sum, t) => sum + t.amount, 0));

	// Calculate comparison summary
	const totalMatched = matchedPairs.reduce((sum, p) => sum + p.matchedAmount, 0);
	// Net LTCG after matching: subtract matched gains and matched losses from totals
	// This shows the remaining taxable LTCG after offsetting gains with losses
	const totalGains = file1TotalGains + file2TotalGains;
	const totalLosses = file1TotalLosses + file2TotalLosses;
	const netLtcgAfterMatching = (totalGains - totalMatched) - (totalLosses - totalMatched);

	// Tax savings estimate (assuming 10% tax on LTCG above 1 lakh exemption)
	const exemptionLimit = 125000;
	const taxableGains = Math.max(0, netLtcgAfterMatching - exemptionLimit);
	const taxSavingsEstimate = taxableGains * 0.1;

	return {
		file1: {
			transactions: file1Transactions,
			totalGains: file1TotalGains,
			totalLosses: file1TotalLosses,
			netLtcg: file1TotalGains - file1TotalLosses,
		},
		file2: {
			transactions: file2Transactions,
			totalGains: file2TotalGains,
			totalLosses: file2TotalLosses,
			netLtcg: file2TotalGains - file2TotalLosses,
		},
		matchedPairs,
		unmatchedGains,
		unmatchedLosses,
		summary: {
			totalMatched,
			netLtcgAfterMatching,
			taxSavingsEstimate,
		},
	};
}

