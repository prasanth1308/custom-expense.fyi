import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function POST(request: NextRequest) {
	const { notes, name, price, category, date, paid_via, account_id, member_id, vaultId } = await request.json();
	return await checkAuth(async (user: any) => {
		try {
			// Check vault permission for write access
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			await prisma.expenses.create({
				data: {
					notes,
					name,
					price,
					category,
					vault_id: vaultId,
					date,
					paid_via,
					account_id: account_id || null,
					member_id: member_id || null,
				},
			});
			const response = NextResponse.json('added', { status: 201 });
			response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
			return response;
		} catch (error) {
			const errorResponse = NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
			errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
			return errorResponse;
		}
	}, false);
}
