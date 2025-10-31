import { NextRequest, NextResponse } from 'next/server';

import { format } from 'date-fns';

import { checkAuth, checkVaultPermission } from 'lib/auth';
import { calculatePaidDates, calculatePrevRenewalDate, calculateRenewalDate } from 'lib/date';
import prisma from 'lib/prisma';

import { dateFormat } from 'constants/date';
import messages from 'constants/messages';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const from = searchParams.get('from') || '';
	const to = searchParams.get('to') || '';
	const vaultId = searchParams.get('vaultId') || '';

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

			const data = await prisma.subscriptions.findMany({
				where: { vault_id: vaultId },
				orderBy: { date: 'desc' },
				select: {
					id: true,
					name: true,
					notes: true,
					url: true,
					price: true,
					paid: true,
					notify: true,
					date: true,
					created_at: true,
					updated_at: true,
					active: true,
					cancelled_at: true,
					nameHash: true,
					vault_id: true,
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

			let updatedDate = data.map((datum) => {
				const renewal_date = calculateRenewalDate(datum.date, datum.paid);
				const prev_renewal_date = format(calculatePrevRenewalDate(renewal_date, datum.paid), dateFormat);
				return {
					...datum,
					renewal_date: format(renewal_date, dateFormat),
					prev_renewal_date,
					paid_dates: calculatePaidDates(datum, from, to),
				};
			});

			if (from !== '' && to !== '') {
				updatedDate = updatedDate.filter((datum) => datum.paid_dates?.length);
			}

			return NextResponse.json(updatedDate, { status: 200 });
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
			await prisma.subscriptions.delete({
				where: { id: id[0] },
			});
			return NextResponse.json('deleted', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}

export async function PUT(request: NextRequest) {
	const { notes, name, price, paid, id, url, date, active, cancelled_at, account_id, member_id, vaultId } = await request.json();

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
			const updateData: any = { notes, name, price, date, url, paid, active, cancelled_at };
			if (account_id !== undefined) updateData.account_id = account_id || null;
			if (member_id !== undefined) updateData.member_id = member_id || null;
			await prisma.subscriptions.update({
				data: updateData,
				where: { id },
			});
			return NextResponse.json('updated', { status: 200 });
		} catch (error) {
			return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
		}
	});
}
