import { NextResponse } from 'next/server';

import { checkAuth } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function POST() {
  return await checkAuth(async (user: any) => {
    try {
      // Check if user already has vaults
      const existingVaults = await prisma.vaults.count({
        where: { owner_id: user.id }
      });

      if (existingVaults > 0) {
        return NextResponse.json({ message: 'User already has vaults' }, { status: 400 });
      }

      // Create default vault for user
      const vault = await prisma.vaults.create({
        data: {
          name: 'Personal Vault',
          description: 'Your personal expense tracking vault',
          owner_id: user.id,
          vault_members: {
            create: {
              user_id: user.id,
              permission: 'write'
            }
          }
        }
      });

      return NextResponse.json({ message: 'Default vault created successfully', vault });
    } catch (error) {
      return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
    }
  });
}
