import { PrismaClient } from '@prisma/client';
// import { fieldEncryptionExtension } from 'prisma-field-encryption';

const prisma = new PrismaClient();

// Temporarily disable encryption for testing
// const prismaClient = prisma.$extends(fieldEncryptionExtension());

export default prisma;
