import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function POST(request: NextRequest) {
	const { notes, name, price, category, date, paid_via, vaultId } = await request.json();
	return await checkAuth(async (user: any) => {
		try {
			// Check vault permission for write access
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			await prisma.expenses.create({
				data: { notes, name, price, category, vault_id: vaultId, date, paid_via },
			});
			return NextResponse.json('added', { status: 201 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	}, false);
}
