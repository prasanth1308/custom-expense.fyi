import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import SignUpEmail from 'emails/signup';

import { Database } from 'lib/database.types';
import resend from 'lib/email';
import prisma from 'lib/prisma';
import { getRedirectUrl } from 'lib/utils';

import messages, { emails } from 'constants/messages';

const supabaseAdmin = createClient<Database>(
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
	process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
	{ auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
	const { email } = await request.json();
	const user = await prisma.users.findFirst({ where: { email }, select: { email: true } });
	if (!user) {
		try {
			// First, create the user in Supabase Auth
			const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
				email,
				email_confirm: false, // User will confirm via magic link
			});

			if (authError) {
				throw authError;
			}

			// Create user in database (vault will be created during signup flow)
            try {
                await prisma.users.create({
                    data: {
                        id: authData.user.id,
                        email
                    }
                });
            } catch (err: any) {
                // Handle unique constraint violation on email
                if (err?.code === 'P2002') {
                    return NextResponse.json({ message: messages.account.exist }, { status: 409 });
                }
                throw err;
            }

			// Then generate the magic link for the newly created user
			const { data, error } = await supabaseAdmin.auth.admin.generateLink({
				type: 'magiclink',
				email,
				options: { redirectTo: getRedirectUrl() },
			});

			if (error) {
				throw error;
			}

			const { properties } = data;
			const { action_link } = properties;

			try {
				await resend.emails.send({
					from: emails.from,
					subject: emails.signup.subject,
					to: email,
					react: SignUpEmail({ action_link }),
				});
				return NextResponse.json({ message: emails.sent });
			} catch (err: any) {
				throw err;
			}
        } catch (error: any) {
            // Surface a clearer response if a duplicate email slips through a race condition
            if (error?.code === 'P2002') {
                return NextResponse.json({ message: messages.account.exist }, { status: 409 });
            }
            return NextResponse.json({ message: String(error) || messages.error }, { status: 500 });
		}
	} else {
		return NextResponse.json({ message: messages.account.exist }, { status: 500 });
	}
}
