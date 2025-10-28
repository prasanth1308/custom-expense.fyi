import { NextRequest, NextResponse } from 'next/server';

import { checkAuth } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { vaultId: string; userId: string } }
) {
  const { vaultId, userId } = params;

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

      // Don't allow removing the owner
      if (vault.owner_id === userId) {
        return NextResponse.json({ message: 'Cannot remove vault owner' }, { status: 400 });
      }

      // Remove the member
      await prisma.vault_members.deleteMany({
        where: {
          vault_id: vaultId,
          user_id: userId
        }
      });

      return NextResponse.json({ message: 'Member removed successfully' });
    } catch (error) {
      return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
    }
  });
}
