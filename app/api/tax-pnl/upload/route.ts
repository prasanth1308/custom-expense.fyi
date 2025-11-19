import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';
import { parseKiteHoldings } from 'lib/taxPnlParser';

import messages from 'constants/messages';

export async function POST(request: NextRequest) {
	return await checkAuth(async (user: any) => {
		try {
			const formData = await request.formData();
			const file = formData.get('file') as File;
			const provider = formData.get('provider') as string;
			const vaultId = formData.get('vaultId') as string;

			if (!file) {
				return NextResponse.json({ message: 'No file provided' }, { status: 400 });
			}

			if (!provider) {
				return NextResponse.json({ message: 'Provider is required' }, { status: 400 });
			}

			if (!vaultId) {
				return NextResponse.json({ message: 'Vault ID is required' }, { status: 400 });
			}

			// Check vault permission for write access
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			// Validate file type
			const fileExtension = file.name.split('.').pop()?.toLowerCase();
			if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
				return NextResponse.json({ message: 'Invalid file type. Please upload Excel or CSV file.' }, { status: 400 });
			}

			// Read file buffer
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Parse holdings based on provider
			let parsedData;
			if (provider === 'kite') {
				parsedData = parseKiteHoldings(buffer);
			} else {
				return NextResponse.json({ message: `Provider ${provider} is not yet supported` }, { status: 400 });
			}

			// Create upload record
			const upload = await prisma.tax_pnl_uploads.create({
				data: {
					vault_id: vaultId,
					provider,
					file_name: file.name,
					uploaded_at: new Date(),
				},
			});

			// Create holdings records
			const holdingsData = parsedData.holdings.map((holding) => ({
				upload_id: upload.id,
				symbol: holding.symbol,
				quantity: holding.quantity.toString(),
				quantity_long_term: holding.quantityLongTerm.toString(),
				average_price: holding.averagePrice.toString(),
				current_price: holding.currentPrice.toString(),
				purchase_date: holding.purchaseDate,
				pnl: holding.pnl.toString(),
				pnl_percentage: holding.pnlPercentage.toString(),
				holding_period_days: holding.holdingPeriodDays,
				is_long_term: holding.isLongTerm,
			}));

			await prisma.tax_pnl_holdings.createMany({
				data: holdingsData,
			});

			// Fetch created holdings with decryption
			const createdHoldings = await prisma.tax_pnl_holdings.findMany({
				where: { upload_id: upload.id },
			});

			return NextResponse.json(
				{
					upload: {
						id: upload.id,
						provider: upload.provider,
						file_name: upload.file_name,
						uploaded_at: upload.uploaded_at,
					},
					holdings: createdHoldings,
					summary: parsedData.summary,
					count: createdHoldings.length,
				},
				{ status: 201 }
			);
		} catch (error: any) {
			console.error('Upload error:', error);
			return NextResponse.json(
				{ error: error.message || 'Failed to process file', message: messages.request.failed },
				{ status: 500 }
			);
		}
	}, false);
}

