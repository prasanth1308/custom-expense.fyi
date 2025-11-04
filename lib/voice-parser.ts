/**
 * Parses voice input text to extract expense details
 * Format: "expenseName amount account paymentMode member"
 * Example: "milk 30 HDFC UPI Family"
 */
export function parseVoiceInput(
	text: string,
	accounts: Array<{ id: string; name: string }>,
	members: Array<{ id: string; name: string }>,
	paymentModes: Record<string, { name: string }>
): {
	name: string;
	price: string;
	account_id: string | null;
	paid_via: string;
	member_id: string | null;
} {
	const words = text.trim().split(/\s+/);
	if (words.length === 0) {
		return {
			name: '',
			price: '',
			account_id: null,
			paid_via: 'upi',
			member_id: null,
		};
	}

	// Find amount (first number in the text, can be with currency symbols or words)
	let amountIndex = -1;
	let amount = '';
	for (let i = 0; i < words.length; i++) {
		// Try to extract number from word (handles "30", "30.50", "₹30", etc.)
		const cleaned = words[i].replace(/[^\d.]/g, '');
		const num = parseFloat(cleaned);
		if (!isNaN(num) && num > 0) {
			amount = cleaned;
			amountIndex = i;
			break;
		}
	}

	// Extract expense name (everything before the amount)
	const name = amountIndex > 0 ? words.slice(0, amountIndex).join(' ') : words[0] || '';

	// Extract remaining words after amount
	const remainingWords = words.slice(amountIndex + 1);

	// Create lookup maps for better matching
	const accountLookup = new Map<string, string>();
	accounts.forEach((acc) => {
		accountLookup.set(acc.name.toLowerCase(), acc.id);
		// Also add partial matches for common patterns
		const words = acc.name.toLowerCase().split(/\s+/);
		words.forEach((word) => {
			if (word.length > 2) {
				accountLookup.set(word, acc.id);
			}
		});
	});

	const memberLookup = new Map<string, string>();
	members.forEach((mem) => {
		memberLookup.set(mem.name.toLowerCase(), mem.id);
		const words = mem.name.toLowerCase().split(/\s+/);
		words.forEach((word) => {
			if (word.length > 2) {
				memberLookup.set(word, mem.id);
			}
		});
	});

	const paymentModeLookup = new Map<string, string>();
	Object.keys(paymentModes).forEach((key) => {
		const modeName = paymentModes[key].name.toLowerCase();
		paymentModeLookup.set(key.toLowerCase(), key);
		paymentModeLookup.set(modeName, key);
		// Handle common variations
		if (key === 'upi') {
			paymentModeLookup.set('u p i', key);
			paymentModeLookup.set('you pay i', key);
		}
		if (key === 'creditcard') {
			paymentModeLookup.set('credit card', key);
			paymentModeLookup.set('credit', key);
		}
		if (key === 'debitcard') {
			paymentModeLookup.set('debit card', key);
			paymentModeLookup.set('debit', key);
		}
		if (key === 'ewallet') {
			paymentModeLookup.set('e wallet', key);
			paymentModeLookup.set('wallet', key);
		}
		if (key === 'netbanking') {
			paymentModeLookup.set('net banking', key);
			paymentModeLookup.set('banking', key);
		}
	});

	// Match account (case-insensitive fuzzy match)
	let account_id: string | null = null;
	let accountMatchIndex = -1;
	for (let i = 0; i < remainingWords.length; i++) {
		const word = remainingWords[i].toLowerCase();
		// Direct match
		if (accountLookup.has(word)) {
			account_id = accountLookup.get(word)!;
			accountMatchIndex = i;
			break;
		}
		// Partial match
		for (const [key, id] of accountLookup.entries()) {
			if (key.includes(word) || word.includes(key)) {
				account_id = id;
				accountMatchIndex = i;
				break;
			}
		}
		if (account_id) break;
	}

	// Match payment mode (case-insensitive fuzzy match)
	let paid_via = 'upi'; // default
	let paymentMatchIndex = -1;
	for (let i = 0; i < remainingWords.length; i++) {
		if (i === accountMatchIndex) continue; // Skip if this was matched as account
		const word = remainingWords[i].toLowerCase();
		// Direct match
		if (paymentModeLookup.has(word)) {
			paid_via = paymentModeLookup.get(word)!;
			paymentMatchIndex = i;
			break;
		}
		// Partial match
		for (const [key, mode] of paymentModeLookup.entries()) {
			if (key === word || key.includes(word) || word.includes(key)) {
				paid_via = mode;
				paymentMatchIndex = i;
				break;
			}
		}
		if (paid_via !== 'upi') break;
	}

	// Match member (case-insensitive fuzzy match)
	// Note: "Family" typically means no member selected, so we skip it
	let member_id: string | null = null;
	for (let i = 0; i < remainingWords.length; i++) {
		if (i === accountMatchIndex || i === paymentMatchIndex) continue;
		const word = remainingWords[i].toLowerCase();
		// Skip "family" as it's the default (no member)
		if (word === 'family') continue;
		// Direct match
		if (memberLookup.has(word)) {
			member_id = memberLookup.get(word)!;
			break;
		}
		// Partial match
		for (const [key, id] of memberLookup.entries()) {
			if (key === word || key.includes(word) || word.includes(key)) {
				member_id = id;
				break;
			}
		}
		if (member_id) break;
	}

	return {
		name: name.trim(),
		price: amount,
		account_id,
		paid_via,
		member_id,
	};
}

