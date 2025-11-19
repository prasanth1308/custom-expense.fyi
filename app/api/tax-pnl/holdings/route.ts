import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const vaultId = searchParams.get('vaultId');
	const uploadId = searchParams.get('uploadId');
	const longTermOnly = searchParams.get('longTermOnly') === 'true';

	return await checkAuth(async (user: any) => {
		try {
			if (!vaultId) {
				return NextResponse.json({ message: 'Vault ID is required' }, { status: 400 });
			}

			// Check vault permission
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'read');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			if (uploadId) {
				// Get specific upload's holdings
				const upload = await prisma.tax_pnl_uploads.findFirst({
					where: {
						id: uploadId,
						vault_id: vaultId,
					},
				});

				if (!upload) {
					return NextResponse.json({ message: 'Upload not found' }, { status: 404 });
				}

				const holdings = await prisma.tax_pnl_holdings.findMany({
					where: {
						upload_id: uploadId,
						...(longTermOnly && { is_long_term: true }),
					},
					orderBy: {
						created_at: 'desc',
					},
				});

				return NextResponse.json({
					upload,
					holdings,
					count: holdings.length,
				});
			} else {
				// Get all uploads for the vault
				const uploads = await prisma.tax_pnl_uploads.findMany({
					where: {
						vault_id: vaultId,
					},
					orderBy: {
						uploaded_at: 'desc',
					},
					include: {
						holdings: {
							...(longTermOnly && { where: { is_long_term: true } }),
						},
					},
				});

				return NextResponse.json({
					uploads,
					count: uploads.length,
				});
			}
		} catch (error) {
			console.error('Holdings fetch error:', error);
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	}, false);
}

export async function DELETE(request: NextRequest) {
	const { id, vaultId } = await request.json();

	return await checkAuth(async (user: any) => {
		try {
			if (!id || !vaultId) {
				return NextResponse.json({ message: 'Upload ID and Vault ID are required' }, { status: 400 });
			}

			// Check vault permission
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			// Verify upload belongs to vault
			const upload = await prisma.tax_pnl_uploads.findFirst({
				where: {
					id,
					vault_id: vaultId,
				},
			});

			if (!upload) {
				return NextResponse.json({ message: 'Upload not found' }, { status: 404 });
			}

			// Delete holdings first (cascade should handle this, but being explicit)
			await prisma.tax_pnl_holdings.deleteMany({
				where: { upload_id: id },
			});

			// Delete upload
			await prisma.tax_pnl_uploads.delete({
				where: { id },
			});

			return NextResponse.json({ message: 'Upload deleted successfully' }, { status: 200 });
		} catch (error) {
			console.error('Delete error:', error);
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	}, false);
}

