import { apiUrls } from 'lib/apiUrls';

export type IncomeData = {
	notes: string;
	name: string;
	price: string;
	category: string;
	date: string;
	id?: string | null;
	vaultId?: string;
};

export const addIncome = async (data: IncomeData) => {
	const res = await fetch(apiUrls.income.add, { 
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

export const deleteIncome = async (id: string, vaultId: string) => {
	const res = await fetch(apiUrls.income.modify, { 
		method: 'DELETE', 
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: [id], vaultId }) 
	});
	return await res.json();
};

export const editIncome = async (data: IncomeData) => {
	const res = await fetch(apiUrls.income.modify, { 
		method: 'PUT', 
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data) 
	});
	return await res.json();
};
