#!/bin/bash

# =============================================================================
# SAFE MIGRATION CREATION SCRIPT
# =============================================================================
# This script creates a migration SQL file WITHOUT applying it to your database.
# You can review the SQL before applying it manually or via prisma migrate deploy
# =============================================================================

set -e  # Exit on any error

# Color output for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Safe Migration Creation Script${NC}"
echo "=========================================="
echo ""

# Step 1: Create migration directory with timestamp
# This ensures each migration has a unique name
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_NAME="${TIMESTAMP}_add_accounts_and_members"
MIGRATION_DIR="prisma/migrations/${MIGRATION_NAME}"

echo -e "${YELLOW}Step 1: Creating migration directory...${NC}"
mkdir -p "${MIGRATION_DIR}"
echo "✅ Created: ${MIGRATION_DIR}"
echo ""

# Step 2: Check if database URL is set
# We need the database URL to compare current state with new schema
echo -e "${YELLOW}Step 2: Checking database connection...${NC}"
if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${RED}❌ ERROR: SUPABASE_DB_URL environment variable is not set${NC}"
    echo ""
    echo "Please set it using one of these methods:"
    echo ""
    echo "Method 1: Export in current session"
    echo "  export SUPABASE_DB_URL='postgresql://user:password@host:port/database'"
    echo "  ./scripts/create-migration-safe.sh"
    echo ""
    echo "Method 2: Pass directly to script"
    echo "  SUPABASE_DB_URL='your-url' ./scripts/create-migration-safe.sh"
    echo ""
    echo "Method 3: Load from .env file (if using dotenv)"
    echo "  source .env"
    echo "  ./scripts/create-migration-safe.sh"
    echo ""
    exit 1
fi

echo "✅ Database URL is set"
echo ""

# Step 3: Generate migration SQL
# This compares your CURRENT database schema with the NEW schema in schema.prisma
# It generates ONLY the SQL needed to update the database, without applying it
echo -e "${YELLOW}Step 3: Generating migration SQL...${NC}"
echo "Comparing current database with prisma/schema.prisma..."
echo ""

# Generate SQL that will transform current DB to match schema.prisma
# --from-url: Current database state
# --to-schema-datamodel: Target schema state
# --script: Output as SQL script (not migration format)
npx prisma migrate diff \
    --from-url "$SUPABASE_DB_URL" \
    --to-schema-datamodel prisma/schema.prisma \
    --script > "${MIGRATION_DIR}/migration.sql" 2>&1

# Check if SQL was generated
if [ ! -s "${MIGRATION_DIR}/migration.sql" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Migration SQL file is empty${NC}"
    echo "This usually means:"
    echo "  1. Your database is already up to date, OR"
    echo "  2. The database URL is incorrect, OR"
    echo "  3. There's a connection issue"
    echo ""
    echo "Checking connection..."
    
    # Try to validate connection
    if ! npx prisma db execute --stdin < /dev/null 2>&1 | grep -q "error"; then
        echo "Database connection seems OK"
    fi
    
    # Clean up empty migration
    rm -rf "${MIGRATION_DIR}"
    exit 1
fi

# Count lines in migration file
SQL_LINES=$(wc -l < "${MIGRATION_DIR}/migration.sql")
echo "✅ Migration SQL generated successfully!"
echo "   File: ${MIGRATION_DIR}/migration.sql"
echo "   Size: ${SQL_LINES} lines"
echo ""

# Step 4: Display preview
echo -e "${YELLOW}Step 4: Preview of migration SQL (first 30 lines)...${NC}"
echo "=========================================="
head -n 30 "${MIGRATION_DIR}/migration.sql" || true
echo ""
if [ "$SQL_LINES" -gt 30 ]; then
    echo "... (${SQL_LINES} total lines, see full file for complete SQL)"
fi
echo ""

# Step 5: Next steps instructions
echo -e "${GREEN}✅ Migration file created successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo "=========================================="
echo ""
echo "1. REVIEW the migration SQL:"
echo "   cat ${MIGRATION_DIR}/migration.sql"
echo ""
echo "2. OPTION A - Apply via Prisma (Recommended for production):"
echo "   # This will apply the migration and track it"
echo "   npx prisma migrate deploy"
echo ""
echo "3. OPTION B - Apply manually:"
echo "   # Copy the SQL and run it in your database admin tool"
echo "   # Then mark it as applied:"
echo "   npx prisma migrate resolve --applied ${MIGRATION_NAME}"
echo ""
echo "4. OPTION C - Use db push (for testing/dev only):"
echo "   # ⚠️  WARNING: This doesn't create migration history"
echo "   # Only use this if you don't need migration tracking"
echo "   npx prisma db push"
echo ""
echo "5. After applying, generate Prisma Client:"
echo "   npx prisma generate"
echo ""
echo -e "${GREEN}✨ Your database is SAFE - nothing has been changed yet!${NC}"

