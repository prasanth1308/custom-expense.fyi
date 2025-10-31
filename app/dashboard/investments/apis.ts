import { apiUrls } from 'lib/apiUrls';

export type InvestmentData = {
	notes: string;
	name: string;
	price: string;
	category: string;
	units: number;
	date: string;
	account_id?: string | null;
	member_id?: string | null;
	id?: string | null;
	vaultId?: string;
};

export const addInvestment = async (data: InvestmentData) => {
	const res = await fetch(apiUrls.investments.add, { 
		method: 'POST', 
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data) 
	});
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

export const deleteInvestment = async (id: string, vaultId: string) => {
	const res = await fetch(apiUrls.investments.modify, { 
		method: 'DELETE', 
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: [id], vaultId }) 
	});
	return await res.json();
};

export const editInvestment = async (data: InvestmentData) => {
	const res = await fetch(apiUrls.investments.modify, { 
		method: 'PUT', 
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data) 
	});
	return await res.json();
};
