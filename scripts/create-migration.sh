#!/bin/bash

# Script to create a migration file for Accounts and Members modules
# Usage: ./scripts/create-migration.sh

set -e

# Get migration name with timestamp
MIGRATION_NAME=$(date +%Y%m%d%H%M%S)_add_accounts_and_members
MIGRATION_DIR="prisma/migrations/${MIGRATION_NAME}"

# Create migration directory
mkdir -p "${MIGRATION_DIR}"

echo "📦 Creating migration: ${MIGRATION_NAME}"
echo "📁 Migration directory: ${MIGRATION_DIR}"

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "⚠️  SUPABASE_DB_URL environment variable is not set."
    echo "Please provide your database URL:"
    echo ""
    echo "Option 1: Export SUPABASE_DB_URL and run again:"
    echo "  export SUPABASE_DB_URL='your-database-url'"
    echo "  ./scripts/create-migration.sh"
    echo ""
    echo "Option 2: Pass it directly:"
    echo "  SUPABASE_DB_URL='your-database-url' ./scripts/create-migration.sh"
    echo ""
    echo "Option 3: Use db push instead (no migration file):"
    echo "  npx prisma db push"
    exit 1
fi

# Generate migration SQL by comparing current DB to new schema
echo "🔄 Generating migration SQL..."
npx prisma migrate diff \
    --from-url "$SUPABASE_DB_URL" \
    --to-schema-datamodel prisma/schema.prisma \
    --script > "${MIGRATION_DIR}/migration.sql"

if [ -s "${MIGRATION_DIR}/migration.sql" ]; then
    echo "✅ Migration SQL generated successfully!"
    echo "📄 File: ${MIGRATION_DIR}/migration.sql"
    echo ""
    echo "📝 Next steps:"
    echo "1. Review the migration SQL: cat ${MIGRATION_DIR}/migration.sql"
    echo "2. Apply using one of these methods:"
    echo "   - npx prisma migrate deploy (for production)"
    echo "   - Manually run the SQL in your database"
    echo "   - npx prisma migrate resolve --applied ${MIGRATION_NAME} (if applied manually)"
else
    echo "⚠️  Migration SQL file is empty. Your database might already be up to date."
    echo "   Or check if the SUPABASE_DB_URL is correct."
    rm -rf "${MIGRATION_DIR}"
fi

