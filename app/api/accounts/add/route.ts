import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function POST(request: NextRequest) {
	const { name, type, starting_balance, notes, member_id, vaultId } = await request.json();
	return await checkAuth(async (user: any) => {
		try {
			const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			await prisma.accounts.create({
				data: {
					name,
					type,
					starting_balance: starting_balance || '0',
					notes: notes || null,
					member_id: member_id || null,
					vault_id: vaultId,
					active: true,
				},
			});
			return NextResponse.json('added', { status: 201 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	}, false);
}

