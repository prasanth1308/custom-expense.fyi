import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

type Where = {
	vault_id: string;
	date?: {
		lte: string;
		gte: string;
	};
	categories?: {
		contains: string;
	};
};

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const categories: any = searchParams.get('categories') || '';
	const vaultId = searchParams.get('vaultId') || '';
	const OR = { OR: categories?.split(',').map((category: any) => ({ category: { contains: category } })) };

	return await checkAuth(async (user: any) => {
		try {
			// Check vault permission
			if (!vaultId) {
				return NextResponse.json({ message: 'Vault ID is required' }, { status: 400 });
			}

			const hasPermission = await checkVaultPermission(user.id, vaultId, 'read');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			const where = {
				vault_id: vaultId,
				...(categories.length && OR),
				...(to && from && { date: { lte: to, gte: from } }),
			};

			if (!from && !to) {
				delete where.date;
			}

			const data = await prisma.expenses.findMany({
				where,
				orderBy: { updated_at: 'desc' },
				select: {
					notes: true,
					name: true,
					price: true,
					category: true,
					paid_via: true,
					id: true,
					date: true,
					created_at: true,
					updated_at: true,
					account_id: true,
					member_id: true,
					account: {
						select: {
							id: true,
							name: true,
							type: true,
						},
					},
					member: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});
			return NextResponse.json(data.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)));
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

export async function DELETE(request: NextRequest) {
	const { id, vaultId } = await request.json();
	return await checkAuth(async (user: any) => {
		if (!id.length || !vaultId) {
			return NextResponse.json(messages.request.invalid, { status: 400 });
		}

		// Check vault permission for write access
		const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
		if (!hasPermission) {
			return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
		}

		try {
			await prisma.expenses.delete({
				where: { id: id[0] },
			});
			return NextResponse.json('deleted', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

export async function PUT(request: NextRequest) {
	const { notes, name, price, category, id, date, paid_via, account_id, member_id, vaultId } = await request.json();

	return await checkAuth(async (user: any) => {
		if (!id || !vaultId) {
			return NextResponse.json(messages.request.invalid, { status: 400 });
		}

		// Check vault permission for write access
		const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
		if (!hasPermission) {
			return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
		}

		try {
			const updateData: any = { notes, name, price, date, paid_via, category };
			if (account_id !== undefined) updateData.account_id = account_id || null;
			if (member_id !== undefined) updateData.member_id = member_id || null;
			await prisma.expenses.update({
				data: updateData,
				where: { id },
			});
			return NextResponse.json('updated', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}
