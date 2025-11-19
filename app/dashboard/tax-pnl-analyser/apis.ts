import { apiUrls } from 'lib/apiUrls';

export type HoldingsData = {
	id: string;
	symbol: string;
	quantity: string;
	quantity_long_term: string;
	average_price: string;
	current_price: string;
	purchase_date: string;
	pnl: string;
	pnl_percentage: string;
	holding_period_days: number;
	is_long_term: boolean;
	created_at: string;
	updated_at: string;
	upload_id: string;
};

export type UploadData = {
	id: string;
	vault_id: string;
	provider: string;
	file_name: string;
	uploaded_at: string;
	created_at: string;
	updated_at: string;
	holdings?: HoldingsData[];
};

export const getHoldings = async (vaultId: string, uploadId?: string, longTermOnly?: boolean) => {
	const params = new URLSearchParams({ vaultId });
	if (uploadId) params.append('uploadId', uploadId);
	if (longTermOnly) params.append('longTermOnly', 'true');

	const res = await fetch(`${apiUrls.taxPnl.holdings}?${params.toString()}`);
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

export const deleteUpload = async (id: string, vaultId: string) => {
	const res = await fetch(apiUrls.taxPnl.holdings, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id, vaultId }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

export const compareUploads = async (uploadId1: string, uploadId2: string, vaultId: string) => {
	const res = await fetch(apiUrls.taxPnl.compare, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ uploadId1, uploadId2, vaultId }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw error;
	}
	return await res.json();
};

