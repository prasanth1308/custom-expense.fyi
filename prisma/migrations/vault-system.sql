-- Migration: Add Vault System
-- This migration adds vault functionality to the expense tracking system

-- Create vaults table
CREATE TABLE IF NOT EXISTS "vaults" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "vaults_pkey" PRIMARY KEY ("id")
);

-- Create vault_members table
CREATE TABLE IF NOT EXISTS "vault_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vault_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_members_pkey" PRIMARY KEY ("id")
);

-- Add vault_id columns to existing tables
ALTER TABLE "expenses" ADD COLUMN "vault_id" UUID;
ALTER TABLE "income" ADD COLUMN "vault_id" UUID;
ALTER TABLE "investments" ADD COLUMN "vault_id" UUID;
ALTER TABLE "subscriptions" ADD COLUMN "vault_id" UUID;

-- Create indexes for better performance
CREATE INDEX "vaults_owner_id_idx" ON "vaults"("owner_id");
CREATE INDEX "vault_members_vault_id_idx" ON "vault_members"("vault_id");
CREATE INDEX "vault_members_user_id_idx" ON "vault_members"("user_id");
CREATE INDEX "expenses_vault_id_idx" ON "expenses"("vault_id");
CREATE INDEX "income_vault_id_idx" ON "income"("vault_id");
CREATE INDEX "investments_vault_id_idx" ON "investments"("vault_id");
CREATE INDEX "subscriptions_vault_id_idx" ON "subscriptions"("vault_id");

-- Add foreign key constraints
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_members" ADD CONSTRAINT "vault_members_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vault_members" ADD CONSTRAINT "vault_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint for vault_members
ALTER TABLE "vault_members" ADD CONSTRAINT "vault_members_vault_id_user_id_key" UNIQUE ("vault_id", "user_id");

-- Create default vaults for existing users
-- This will create a default vault for each existing user and migrate their data
DO $$
DECLARE
    user_record RECORD;
    vault_id UUID;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        -- Create a default vault for each user
        vault_id := gen_random_uuid();
        
        INSERT INTO vaults (id, name, description, owner_id, created_at, updated_at)
        VALUES (vault_id, 'Personal Vault', 'Your personal expense tracking vault', user_record.id, NOW(), NOW());
        
        -- Add the user as a member with write permission
        INSERT INTO vault_members (id, vault_id, user_id, permission, created_at, updated_at)
        VALUES (gen_random_uuid(), vault_id, user_record.id, 'write', NOW(), NOW());
        
        -- Migrate existing data to the vault
        UPDATE expenses SET vault_id = vault_id WHERE user_id = user_record.id;
        UPDATE income SET vault_id = vault_id WHERE user_id = user_record.id;
        UPDATE investments SET vault_id = vault_id WHERE user_id = user_record.id;
        UPDATE subscriptions SET vault_id = vault_id WHERE user_id = user_record.id;
    END LOOP;
END $$;

-- Make vault_id columns NOT NULL after migration
ALTER TABLE "expenses" ALTER COLUMN "vault_id" SET NOT NULL;
ALTER TABLE "income" ALTER COLUMN "vault_id" SET NOT NULL;
ALTER TABLE "investments" ALTER COLUMN "vault_id" SET NOT NULL;
ALTER TABLE "subscriptions" ALTER COLUMN "vault_id" SET NOT NULL;

-- Add foreign key constraints for vault relationships
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "income" ADD CONSTRAINT "income_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "investments" ADD CONSTRAINT "investments_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove old user_id foreign key constraints and columns
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_user_id_fkey";
ALTER TABLE "income" DROP CONSTRAINT IF EXISTS "income_user_id_fkey";
ALTER TABLE "investments" DROP CONSTRAINT IF EXISTS "investments_user_id_fkey";
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_user_id_fkey";

ALTER TABLE "expenses" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "income" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "investments" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "user_id";

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vault_members_updated_at BEFORE UPDATE ON vault_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
