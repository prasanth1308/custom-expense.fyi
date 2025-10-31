import { NextRequest, NextResponse } from 'next/server';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const vaultId = searchParams.get('vaultId') || '';
	const memberId = searchParams.get('memberId') || '';

	return await checkAuth(async (user: any) => {
		try {
			if (!vaultId) {
				return NextResponse.json({ message: 'Vault ID is required' }, { status: 400 });
			}

			const hasPermission = await checkVaultPermission(user.id, vaultId, 'read');
			if (!hasPermission) {
				return NextResponse.json({ message: 'Insufficient permissions for this vault' }, { status: 403 });
			}

			const where: any = {
				vault_id: vaultId,
			};

			if (memberId) {
				where.member_id = memberId;
			}

			const accounts = await prisma.accounts.findMany({
				where,
				orderBy: { updated_at: 'desc' },
				select: {
					id: true,
					name: true,
					type: true,
					starting_balance: true,
					notes: true,
					active: true,
					member_id: true,
					created_at: true,
					updated_at: true,
					member: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			// Calculate current balance for each account
			const accountsWithBalance = await Promise.all(
				accounts.map(async (account) => {
					const expenses = await prisma.expenses.findMany({
						where: { account_id: account.id },
						select: { price: true },
					});

					const income = await prisma.income.findMany({
						where: { account_id: account.id },
						select: { price: true },
					});

					const expensesSum = expenses.reduce((sum, e) => sum + parseFloat(e.price || '0'), 0);
					const incomeSum = income.reduce((sum, i) => sum + parseFloat(i.price || '0'), 0);
					const startingBalance = parseFloat(account.starting_balance || '0');
					const currentBalance = (startingBalance + incomeSum - expensesSum).toFixed(2);

					return {
						...account,
						current_balance: currentBalance,
					};
				})
			);

			return NextResponse.json(accountsWithBalance);
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

export async function PUT(request: NextRequest) {
	const { id, name, type, starting_balance, notes, active, member_id, vaultId } = await request.json();

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
			if (type !== undefined) updateData.type = type;
			if (starting_balance !== undefined) updateData.starting_balance = starting_balance;
			if (notes !== undefined) updateData.notes = notes;
			if (active !== undefined) updateData.active = active;
			if (member_id !== undefined) updateData.member_id = member_id;

			await prisma.accounts.update({
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
			await prisma.accounts.update({
				data: { active: false },
				where: { id },
			});
			return NextResponse.json('deleted', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

