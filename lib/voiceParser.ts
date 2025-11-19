import { expensesCategory, expensesPay } from 'constants/categories';
import { format } from 'date-fns';
import { dateFormat } from 'constants/date';

interface ParsedExpense {
	name?: string;
	price?: string;
	category?: string;
	paid_via?: string;
	date?: string;
	notes?: string;
	member_id?: string | null;
}

// Category mapping (case-insensitive)
const categoryMap: { [key: string]: string } = {
	food: 'food',
	grocery: 'grocery',
	medical: 'medical',
	bills: 'bills',
	education: 'education',
	entertainment: 'entertainment',
	travel: 'travel',
	shopping: 'shopping',
	rent: 'rent',
	emi: 'emi',
	savings: 'savings',
	debt: 'debt',
	loan: 'loan',
	sports: 'sports',
	order: 'order',
	other: 'other',
};

// Payment method mapping (case-insensitive)
const paymentMap: { [key: string]: string } = {
	cash: 'cash',
	creditcard: 'creditcard',
	credit: 'creditcard',
	'credit card': 'creditcard',
	debitcard: 'debitcard',
	debit: 'debitcard',
	'debit card': 'debitcard',
	upi: 'upi',
	phonepe: 'upi',
	gpay: 'upi',
	paytm: 'upi',
	'google pay': 'upi',
	ewallet: 'ewallet',
	wallet: 'ewallet',
	'e-wallet': 'ewallet',
	netbanking: 'netbanking',
	'net banking': 'netbanking',
	bank: 'netbanking',
	banking: 'netbanking',
};

// Currency words to ignore
const currencyWords = ['rupees', 'rupee', 'rs', 'inr', 'dollars', 'dollar', 'usd', '$'];

/**
 * Parse structured voice input in natural speech format: Name Price Category Paid Via Member
 * Example: "Milk 40 Food UPI Family" or "Swiggy 250 Food UPI"
 * 
 * Format: Name Price(₹) Category Paid Via Member
 * - Parses in order: Name (text), Price (number), Category (keyword), Paid Via (keyword), Member (text)
 * - All fields except Name are optional
 * - Uses natural pauses and word patterns to identify fields
 */
export function parseVoiceInput(text: string): ParsedExpense {
	const trimmedText = text.trim();
	const result: ParsedExpense = {};

	// Normalize text - handle common voice recognition variations
	let normalizedText = trimmedText
		.toLowerCase()
		.replace(/\s+/g, ' ') // Multiple spaces to single space
		.trim();

	// Split by spaces to get words
	const words = normalizedText.split(/\s+/);
	
	if (words.length === 0) {
		return result;
	}

	// Track what we've found and their positions
	let nameParts: string[] = [];
	let priceIndex = -1;
	let categoryIndex = -1;
	let paymentIndex = -1;
	let memberIndex = -1;
	let memberParts: string[] = [];

	// First pass: identify structured fields (price, category, payment, member)
	for (let i = 0; i < words.length; i++) {
		const word = words[i].trim();
		if (!word) continue;

		// Skip currency words
		if (currencyWords.includes(word)) {
			continue;
		}

		// Check if it's a number (price) - only if not already found
		if (priceIndex === -1) {
			const numberMatch = word.match(/^(\d+(?:[.,]\d+)?)$/);
			if (numberMatch) {
				result.price = numberMatch[1].replace(/,/g, '');
				priceIndex = i;
				continue;
			}
		}

		// Check if it's a category keyword - only if not already found
		if (categoryIndex === -1) {
			// Try exact match
			if (categoryMap[word]) {
				result.category = categoryMap[word];
				categoryIndex = i;
				continue;
			}
			// Try partial match
			for (const [key, value] of Object.entries(categoryMap)) {
				if (word.includes(key) || key.includes(word)) {
					result.category = value;
					categoryIndex = i;
					break;
				}
			}
			if (categoryIndex !== -1) continue;
		}

		// Check if it's a payment method keyword - only if not already found
		if (paymentIndex === -1) {
			// Try exact match
			if (paymentMap[word]) {
				result.paid_via = paymentMap[word];
				paymentIndex = i;
				continue;
			}
			// Try partial match
			for (const [key, value] of Object.entries(paymentMap)) {
				if (word.includes(key) || key.includes(word)) {
					result.paid_via = value;
					paymentIndex = i;
					break;
				}
			}
			if (paymentIndex !== -1) continue;
		}

		// Check if it's "family" (member keyword)
		if (word === 'family' && memberIndex === -1) {
			memberIndex = i;
			continue;
		}
	}

	// Second pass: collect name (words before first structured field) and member (words after last structured field)
	const firstStructuredIndex = Math.min(
		priceIndex !== -1 ? priceIndex : Infinity,
		categoryIndex !== -1 ? categoryIndex : Infinity,
		paymentIndex !== -1 ? paymentIndex : Infinity,
		memberIndex !== -1 ? memberIndex : Infinity
	);

	const lastStructuredIndex = Math.max(
		priceIndex !== -1 ? priceIndex : -1,
		categoryIndex !== -1 ? categoryIndex : -1,
		paymentIndex !== -1 ? paymentIndex : -1,
		memberIndex !== -1 ? memberIndex : -1
	);

	// Collect name: all words before the first structured field (excluding currency words)
	for (let i = 0; i < firstStructuredIndex && i < words.length; i++) {
		if (!currencyWords.includes(words[i])) {
			nameParts.push(words[i]);
		}
	}

	// Collect member: all words after the last structured field (if member wasn't explicitly "family")
	if (memberIndex === -1 && lastStructuredIndex !== -1) {
		for (let i = lastStructuredIndex + 1; i < words.length; i++) {
			memberParts.push(words[i]);
		}
	} else if (memberIndex !== -1 && words[memberIndex] !== 'family') {
		// If member was found but not "family", collect words after it
		for (let i = memberIndex + 1; i < words.length; i++) {
			memberParts.push(words[i]);
		}
	}

	// Set name (required) - use collected name parts or fallback to first word
	if (nameParts.length > 0) {
		result.name = nameParts.join(' ').substring(0, 30);
	} else if (words.length > 0) {
		// Fallback: use first word as name if no name parts collected
		result.name = words[0].substring(0, 30);
	}

	// Handle member
	if (memberParts.length > 0) {
		const memberName = memberParts.join(' ');
		if (memberName.toLowerCase() !== 'family') {
			result.notes = `Member: ${memberName}`;
		}
	}

	// Set default date to today if not specified
	if (!result.date) {
		result.date = format(new Date(), dateFormat);
	}

	return result;
}

