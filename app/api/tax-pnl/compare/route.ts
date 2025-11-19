import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function POST(request: NextRequest) {
	const { uploadId1, uploadId2, vaultId } = await request.json();

	return await checkAuth(async (user: any) => {
		try {
			if (!uploadId1 || !uploadId2 || !vaultId) {
				return NextResponse.json(
					{ message: 'Both upload IDs and vault ID are required' },
					{ status: 400 }
				);
			}

			// Check vault permission
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'read');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			// Fetch both uploads with holdings
			const [upload1, upload2] = await Promise.all([
				prisma.tax_pnl_uploads.findFirst({
					where: { id: uploadId1, vault_id: vaultId },
					include: { holdings: true },
				}),
				prisma.tax_pnl_uploads.findFirst({
					where: { id: uploadId2, vault_id: vaultId },
					include: { holdings: true },
				}),
			]);

			if (!upload1 || !upload2) {
				return NextResponse.json({ message: 'One or both uploads not found' }, { status: 404 });
			}

			// Create maps for easy lookup
			const holdings1Map = new Map(
				upload1.holdings.map((h) => [h.symbol, h])
			);
			const holdings2Map = new Map(
				upload2.holdings.map((h) => [h.symbol, h])
			);

			// Find differences
			const added: any[] = [];
			const removed: any[] = [];
			const changed: any[] = [];

			// Holdings in upload2 but not in upload1 (added)
			upload2.holdings.forEach((holding2) => {
				if (!holdings1Map.has(holding2.symbol)) {
					added.push(holding2);
				}
			});

			// Holdings in upload1 but not in upload2 (removed)
			upload1.holdings.forEach((holding1) => {
				if (!holdings2Map.has(holding1.symbol)) {
					removed.push(holding1);
				}
			});

			// Holdings that exist in both but changed
			upload1.holdings.forEach((holding1) => {
				const holding2 = holdings2Map.get(holding1.symbol);
				if (holding2) {
					const qty1 = parseFloat(holding1.quantity || '0');
					const qty2 = parseFloat(holding2.quantity || '0');
					const pnl1 = parseFloat(holding1.pnl || '0');
					const pnl2 = parseFloat(holding2.pnl || '0');

					if (
						qty1 !== qty2 ||
						holding1.is_long_term !== holding2.is_long_term ||
						Math.abs(pnl1 - pnl2) > 0.01
					) {
						changed.push({
							symbol: holding1.symbol,
							upload1: {
								quantity: holding1.quantity,
								pnl: holding1.pnl,
								is_long_term: holding1.is_long_term,
							},
							upload2: {
								quantity: holding2.quantity,
								pnl: holding2.pnl,
								is_long_term: holding2.is_long_term,
							},
							quantityChange: qty2 - qty1,
							pnlChange: pnl2 - pnl1,
						});
					}
				}
			});

			// Calculate summary differences
			const totalPnl1 = upload1.holdings.reduce(
				(sum, h) => sum + parseFloat(h.pnl || '0'),
				0
			);
			const totalPnl2 = upload2.holdings.reduce(
				(sum, h) => sum + parseFloat(h.pnl || '0'),
				0
			);

			const longTermCount1 = upload1.holdings.filter((h) => h.is_long_term).length;
			const longTermCount2 = upload2.holdings.filter((h) => h.is_long_term).length;

			return NextResponse.json({
				upload1: {
					id: upload1.id,
					file_name: upload1.file_name,
					uploaded_at: upload1.uploaded_at,
					totalHoldings: upload1.holdings.length,
					totalPnl: totalPnl1,
					longTermCount: longTermCount1,
				},
				upload2: {
					id: upload2.id,
					file_name: upload2.file_name,
					uploaded_at: upload2.uploaded_at,
					totalHoldings: upload2.holdings.length,
					totalPnl: totalPnl2,
					longTermCount: longTermCount2,
				},
				comparison: {
					added: added.length,
					removed: removed.length,
					changed: changed.length,
					pnlDifference: totalPnl2 - totalPnl1,
					longTermDifference: longTermCount2 - longTermCount1,
				},
				details: {
					added,
					removed,
					changed,
				},
			});
		} catch (error) {
			console.error('Compare error:', error);
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	}, false);
}

