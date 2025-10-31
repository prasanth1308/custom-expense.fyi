# 📘 Safe Migration Guide - Accounts & Members Feature

This guide will help you create and apply database migrations **WITHOUT affecting your live database** until you're ready.

## 🎯 Overview

This migration adds:
- `accounts` table (with account types: bank, credit card, debit card, gift card, prepaid card, cash)
- `members` table (for family members)
- `account_id` and `member_id` columns to `expenses`, `income`, `investments`, and `subscriptions` tables

## ✅ Step 1: Create Migration File (Safe - No DB Changes)

This step **ONLY creates a SQL file** - it doesn't touch your database.

```bash
# Make sure your database URL is set
export SUPABASE_DB_URL='your-database-connection-string'

# Run the safe migration script
./scripts/create-migration-safe.sh
```

**What this does:**
- ✅ Compares your current database with `prisma/schema.prisma`
- ✅ Generates SQL file in `prisma/migrations/[timestamp]_add_accounts_and_members/migration.sql`
- ✅ **Does NOT apply any changes** to your database
- ✅ Shows you a preview of what will be changed

**Output example:**
```
📦 Safe Migration Creation Script
==========================================

Step 1: Creating migration directory...
✅ Created: prisma/migrations/20251031173045_add_accounts_and_members

Step 2: Checking database connection...
✅ Database URL is set

Step 3: Generating migration SQL...
Comparing current database with prisma/schema.prisma...
✅ Migration SQL generated successfully!
   File: prisma/migrations/20251031173045_add_accounts_and_members/migration.sql
   Size: 45 lines

Step 4: Preview of migration SQL (first 30 lines)...
==========================================
-- CreateTable
CREATE TABLE "accounts" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  ...
```

## 📖 Step 2: Review the Migration SQL

**Always review before applying!**

```bash
# View the complete migration SQL
cat prisma/migrations/[TIMESTAMP]_add_accounts_and_members/migration.sql
```

**What to look for:**
- ✅ Creates `accounts` table
- ✅ Creates `members` table  
- ✅ Adds `account_id` and `member_id` to existing tables (nullable, so existing data is safe)
- ✅ Adds proper indexes and foreign keys
- ✅ No `DROP` statements that would delete data

## 🚀 Step 3: Apply Migration (Choose One Method)

### Option A: Prisma Migrate Deploy (Recommended for Production)

**Best for:** Production databases with migration history tracking

```bash
# Apply the migration
npx prisma migrate deploy

# Generate Prisma Client with new types
npx prisma generate
```

**What this does:**
- ✅ Applies the migration to your database
- ✅ Records it in `_prisma_migrations` table
- ✅ Tracks migration history

### Option B: Manual Application

**Best for:** When you want full control or are using external migration tools

1. **Copy the SQL from the migration file**
2. **Run it in your database admin tool** (Supabase Dashboard, pgAdmin, etc.)
3. **Mark it as applied in Prisma:**

```bash
npx prisma migrate resolve --applied [MIGRATION_NAME]
# Example:
npx prisma migrate resolve --applied 20251031173045_add_accounts_and_members

# Generate Prisma Client
npx prisma generate
```

### Option C: DB Push (Testing/Dev Only)

**⚠️ WARNING:** This doesn't create migration history. Only use for testing!

```bash
# This directly syncs schema without migration tracking
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## 🔍 Step 4: Verify Migration

After applying, verify everything worked:

```bash
# Open Prisma Studio to see the new tables
npx prisma studio
```

**Check:**
- ✅ `accounts` table exists
- ✅ `members` table exists
- ✅ `expenses`, `income`, `investments`, `subscriptions` have new `account_id` and `member_id` columns
- ✅ Existing records have `NULL` values for new columns (backward compatible)

## 🛡️ Safety Features

### Backward Compatibility
- All new columns are **nullable** (`String?`)
- Existing records will have `NULL` values
- No data is lost or modified

### Rollback Plan

If you need to rollback:

```bash
# Option 1: Manual rollback SQL
# Create a rollback migration with DROP statements

# Option 2: Restore from backup
# Use your regular database backup procedure
```

## 📝 Migration File Location

```
prisma/migrations/
  └── [TIMESTAMP]_add_accounts_and_members/
      └── migration.sql
```

## ❓ Troubleshooting

### Error: "Database schema is not empty"
**Solution:** You're using a database that already has data. Use `prisma migrate diff` to generate baseline migration (as shown in the script).

### Error: "SUPABASE_DB_URL not set"
**Solution:** Export your database URL:
```bash
export SUPABASE_DB_URL='postgresql://user:pass@host:port/dbname'
```

### Empty migration file
**Causes:**
- Database already matches schema (nothing to migrate)
- Database URL incorrect
- Connection issues

**Solution:** Verify connection and check if schema is already up to date.

## ✨ Summary

1. ✅ **Create**: Run `./scripts/create-migration-safe.sh` (no DB changes)
2. ✅ **Review**: Check `prisma/migrations/.../migration.sql`
3. ✅ **Apply**: Use `prisma migrate deploy` or manual application
4. ✅ **Verify**: Check with `prisma studio`
5. ✅ **Generate**: Run `npx prisma generate`

**Your database is safe until you manually apply the migration!** 🎉

