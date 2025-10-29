import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { addYears } from 'date-fns';
import PlanExpiredEmail from 'emails/plan-expired';
import UsageExceededEmail from 'emails/usage-limit-exceeded';

import messages, { emails } from 'constants/messages';
import { basicPlan, premiumPlan } from 'constants/usage';

import resend from './email';
import prisma from './prisma';

type UserData = {
	email: string;
	basic_usage_limit_email: boolean;
	premium_usage_limit_email: boolean;
	premium_plan_expired_email: boolean;
};

const hasPremiumPlanExpired = (billingCycleData: string) => {
	const todayDate = new Date();
	const endDateForBilling = addYears(new Date(billingCycleData), 1);
	return todayDate > endDateForBilling;
};

const getUserUsageLimit = (user: any) => {
	const { billing_start_date, plan_status, usage, order_status } = user;

	const isBasicUsageExceeded = plan_status === 'basic' && usage + 1 > basicPlan.limit;
	const isPremium = plan_status === 'premium' && order_status === 'paid';
	const isPremiumUsageExceeded = isPremium && usage + 1 > premiumPlan.limit;
	const isPremiumPlanExpired = isPremium && hasPremiumPlanExpired(billing_start_date);

	return { isBasicUsageExceeded, isPremiumUsageExceeded, isPremiumPlanExpired };
};

// Helper function to check vault permissions
export const checkVaultPermission = async (userId: string, vaultId: string, requiredPermission: 'read' | 'write' = 'read') => {
	const vault = await prisma.vaults.findFirst({
		where: {
			id: vaultId,
			OR: [
				{ owner_id: userId },
				{ vault_members: { some: { user_id: userId, permission: requiredPermission } } }
			]
		}
	});

	return !!vault;
};

// Helper function to ensure user exists in database
export const ensureUserExists = async (userId: string, email: string) => {
	try {
		let user = await prisma.users.findUnique({ where: { id: userId } });
		
		if (!user) {
			user = await prisma.users.create({
				data: {
					id: userId,
					email: email
				}
			});
		}
		
		return user;
	} catch (error) {
		console.error('Failed to ensure user exists:', error);
		throw error;
	}
};

// Helper function to get user's vault access
export const getUserVaultAccess = async (userId: string, vaultId: string) => {
	const vault = await prisma.vaults.findFirst({
		where: {
			id: vaultId,
			OR: [
				{ owner_id: userId },
				{ vault_members: { some: { user_id: userId } } }
			]
		},
		include: {
			vault_members: {
				where: { user_id: userId }
			}
		}
	});

	if (!vault) return null;

	const isOwner = vault.owner_id === userId;
	const permission = isOwner ? 'write' : (vault.vault_members[0]?.permission || 'read');

	return {
		vault,
		permission,
		isOwner
	};
};

export const checkAuth = async (callback: Function, isGetMethod = true) => {
	const supabase = createServerActionClient({ cookies });
	const { data } = await supabase.auth.getSession();
	const { session } = data;

	if (session && session.user) {
		try {
			const user = await ensureUserExists(session.user.id, session.user.email || '');
			
			const { basic_usage_limit_email, premium_usage_limit_email, premium_plan_expired_email } = user as UserData;
			const { isBasicUsageExceeded, isPremiumUsageExceeded, isPremiumPlanExpired } = getUserUsageLimit(user);

			if (isBasicUsageExceeded && !isGetMethod && user) {
				if (!basic_usage_limit_email) {
					try {
						await resend.emails.send({
							from: emails.from,
							subject: emails.usageLimit.basic.subject,
							to: user.email,
							react: UsageExceededEmail({ maxUsageLimit: basicPlan.limit }),
						});
						await prisma.users.update({ where: { id: user?.id }, data: { basic_usage_limit_email: true } });
					} catch (error) {
						return NextResponse.json({ message: messages.serverError }, { status: 401 });
					}
				}
				return NextResponse.json({ message: emails.usageLimit.basic.message }, { status: 403 });
			}

			if (isPremiumPlanExpired && !isGetMethod && user) {
				if (!premium_plan_expired_email) {
					try {
						await resend.emails.send({
							from: emails.from,
							subject: emails.usageLimit.premiumExpired.subject,
							to: user.email,
							react: PlanExpiredEmail({ plan: 'Premium Plan' }),
						});
						await prisma.users.update({ where: { id: user?.id }, data: { premium_plan_expired_email: true } });
					} catch (error) {
						return NextResponse.json({ message: messages.serverError }, { status: 401 });
					}
				}
				return NextResponse.json({ message: emails.usageLimit.premiumExpired.message }, { status: 403 });
			}

			if (isPremiumUsageExceeded && !isGetMethod && user) {
				if (!premium_usage_limit_email) {
					try {
						await resend.emails.send({
							from: emails.from,
							subject: emails.usageLimit.premium.subject,
							to: user.email,
							react: UsageExceededEmail({ maxUsageLimit: premiumPlan.limit, plan: 'Premium Plan' }),
						});
						await prisma.users.update({ where: { id: user?.id }, data: { premium_usage_limit_email: true } });
					} catch (error) {
						return NextResponse.json({ message: messages.serverError }, { status: 401 });
					}
				}
				return NextResponse.json({ message: emails.usageLimit.premium.message }, { status: 403 });
			}
			return callback(session.user);
		} catch (error) {
			console.error('Failed to process user authentication:', error);
			return NextResponse.json({ message: 'Failed to process user authentication' }, { status: 500 });
		}
	} else {
		return NextResponse.json({ message: messages.account.unauthorized }, { status: 401 });
	}
};