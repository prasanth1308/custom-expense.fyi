import { apiUrls } from 'lib/apiUrls';

export type AccountData = {
	name: string;
	type: string;
	starting_balance: string;
	notes?: string;
	member_id?: string | null;
	id: string | null;
	vaultId?: string;
	active?: boolean;
};

export const getAccounts = async (vaultId: string) => {
	const res = await fetch(`${apiUrls.accounts.getAccounts()}?vaultId=${vaultId}`);
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

export const addAccount = async (data: AccountData) => {
	const res = await fetch(apiUrls.accounts.add, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

export const deleteAccount = async (id: string, vaultId: string) => {
	const res = await fetch(apiUrls.accounts.modify, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id, vaultId }),
	});
	return await res.json();
};

export const editAccount = async (data: AccountData) => {
	const res = await fetch(apiUrls.accounts.modify, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	return await res.json();
};

