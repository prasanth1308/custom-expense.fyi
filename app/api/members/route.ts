import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const vaultId = searchParams.get('vaultId') || '';

	return await checkAuth(async (user: any) => {
		try {
			if (!vaultId) {
				return NextResponse.json({ message: 'Vault ID is required' }, { status: 400 });
			}

			const hasPermission = await checkVaultPermission(user.id, vaultId, 'read');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			const members = await prisma.members.findMany({
				where: {
					vault_id: vaultId,
				},
				orderBy: { updated_at: 'desc' },
				select: {
					id: true,
					name: true,
					notes: true,
					active: true,
					created_at: true,
					updated_at: true,
				},
			});

			// Calculate linked accounts count and transaction counts for each member
			const membersWithCounts = await Promise.all(
				members.map(async (member) => {
					const accountsCount = await prisma.accounts.count({
						where: { member_id: member.id, active: true },
					});

					const expensesCount = await prisma.expenses.count({
						where: { member_id: member.id },
					});

					const incomeCount = await prisma.income.count({
						where: { member_id: member.id },
					});

					return {
						...member,
						linked_accounts_count: accountsCount,
						expenses_count: expensesCount,
						income_count: incomeCount,
					};
				})
			);

			return NextResponse.json(membersWithCounts);
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

export async function PUT(request: NextRequest) {
	const { id, name, notes, active, vaultId } = await request.json();

	return await checkAuth(async (user: any) => {
		if (!id || !vaultId) {
			return NextResponse.json(messages.request.invalid, { status: 400 });
		}

		const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
		if (!hasPermission) {
			return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
		}

		try {
			const updateData: any = {};
			if (name !== undefined) updateData.name = name;
			if (notes !== undefined) updateData.notes = notes;
			if (active !== undefined) updateData.active = active;

			await prisma.members.update({
				data: updateData,
				where: { id },
			});
			return NextResponse.json('updated', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

export async function DELETE(request: NextRequest) {
	const { id, vaultId } = await request.json();

	return await checkAuth(async (user: any) => {
		if (!id || !vaultId) {
			return NextResponse.json(messages.request.invalid, { status: 400 });
		}

		const hasPermission = await checkVaultPermission(user.id, vaultId, 'write');
		if (!hasPermission) {
			return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
		}

		try {
			// Soft delete - set active to false
			await prisma.members.update({
				data: { active: false },
				where: { id },
			});
			return NextResponse.json('deleted', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

