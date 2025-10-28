import { NextRequest, NextResponse } from 'next/server';

import { checkAuth } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function POST(
  request: NextRequest,
  { params }: { params: { vaultId: string } }
) {
  const { userEmail, permission } = await request.json();
  const { vaultId } = params;

  return await checkAuth(async (user: any) => {
    try {
      // Check if user has write access to this vault
      const vault = await prisma.vaults.findFirst({
        where: {
          id: vaultId,
          OR: [
            { owner_id: user.id },
            { vault_members: { some: { user_id: user.id, permission: 'write' } } }
          ]
        }
      });

      if (!vault) {
        return NextResponse.json({ message: 'Vault not found or insufficient permissions' }, { status: 404 });
      }

      // Find the user to share with
      const targetUser = await prisma.users.findFirst({
        where: { email: userEmail }
      });

      if (!targetUser) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      // Check if user is already a member
      const existingMember = await prisma.vault_members.findUnique({
        where: {
          vault_id_user_id: {
            vault_id: vaultId,
            user_id: targetUser.id
          }
        }
      });

      if (existingMember) {
        return NextResponse.json({ message: 'User is already a member of this vault' }, { status: 400 });
      }

      // Add user as vault member
      await prisma.vault_members.create({
        data: {
          vault_id: vaultId,
          user_id: targetUser.id,
          permission
        }
      });

      return NextResponse.json({ message: 'Vault shared successfully' });
    } catch (error) {
      return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
    }
  });
}
