import { apiUrls } from 'lib/apiUrls';

export type MemberData = {
	name: string;
	notes?: string;
	id: string | null;
	vaultId?: string;
	active?: boolean;
};

export const getMembers = async (vaultId: string) => {
	const res = await fetch(`${apiUrls.members.getMembers()}?vaultId=${vaultId}`);
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

export const addMember = async (data: MemberData) => {
	const res = await fetch(apiUrls.members.add, {
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

export const deleteMember = async (id: string, vaultId: string) => {
	const res = await fetch(apiUrls.members.modify, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id, vaultId }),
	});
	return await res.json();
};

export const editMember = async (data: MemberData) => {
	const res = await fetch(apiUrls.members.modify, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	return await res.json();
};

