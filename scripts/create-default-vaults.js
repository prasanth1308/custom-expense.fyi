const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDefaultVaults() {
  try {
    console.log('Creating default vaults for existing users...');
    
    // Get all users who don't have any vaults
    const usersWithoutVaults = await prisma.users.findMany({
      where: {
        owned_vaults: {
          none: {}
        }
      }
    });

    console.log(`Found ${usersWithoutVaults.length} users without vaults`);

    for (const user of usersWithoutVaults) {
      // Create a default vault for each user
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

      console.log(`Created vault "${vault.name}" for user ${user.email}`);
    }

    console.log('✅ Default vaults created successfully!');
  } catch (error) {
    console.error('❌ Error creating default vaults:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultVaults();
