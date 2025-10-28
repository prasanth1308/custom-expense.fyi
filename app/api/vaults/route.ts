import { NextRequest, NextResponse } from 'next/server';

import { checkAuth } from 'lib/auth';
import prisma from 'lib/prisma';

import messages from 'constants/messages';

export async function GET() {
  return await checkAuth(async (user: any) => {
    try {
      // Get vaults where user is owner or member
      const vaults = await prisma.vaults.findMany({
        where: {
          OR: [
            { owner_id: user.id },
            { vault_members: { some: { user_id: user.id } } }
          ]
        },
        include: {
          vault_members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Transform the data to include permission information
      const transformedVaults = vaults.map(vault => {
        const userMembership = vault.vault_members.find(member => member.user_id === user.id);
        const isOwner = vault.owner_id === user.id;
        
        return {
          id: vault.id,
          name: vault.name,
          description: vault.description,
          owner_id: vault.owner_id,
          permission: isOwner ? 'write' : (userMembership?.permission || 'read'),
          is_owner: isOwner,
          members: vault.vault_members.map(member => ({
            id: member.user.id,
            email: member.user.email,
            permission: member.permission
          }))
        };
      });

      return NextResponse.json(transformedVaults);
    } catch (error) {
      return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  const { name, description } = await request.json();

  return await checkAuth(async (user: any) => {
    try {
      // Check if user already has 3 vaults (limit)
      const vaultCount = await prisma.vaults.count({
        where: { owner_id: user.id }
      });

      if (vaultCount >= 3) {
        return NextResponse.json({ message: 'Maximum of 3 vaults allowed per user' }, { status: 400 });
      }

      // Create new vault
      const vault = await prisma.vaults.create({
        data: {
          name,
          description,
          owner_id: user.id,
          vault_members: {
            create: {
              user_id: user.id,
              permission: 'write'
            }
          }
        }
      });

      return NextResponse.json(vault);
    } catch (error) {
      return NextResponse.json({ error, message: messages.request.failed }, { status: 500 });
    }
  });
}
