# Tax P&L Analyser - Setup Guide

## Step-by-Step Instructions

### Step 1: Generate Prisma Client and Apply Database Changes

You have two options depending on your environment:

#### Option A: Development/Testing (Recommended for first-time setup)

This method directly syncs your database schema without creating migration files. Perfect for development:

```bash
# This will format schema, generate Prisma Client, and push changes to database
npm run dbpush
```

**What this does:**
- Formats your Prisma schema
- Generates Prisma Client with new types
- Pushes schema changes directly to your database
- Creates `tax_pnl_uploads` and `tax_pnl_holdings` tables

#### Option B: Production (With Migration History)

If you want to track migration history (recommended for production):

```bash
# 1. Create a migration file
npx prisma migrate dev --name add_tax_pnl_tables

# 2. This will:
#    - Create migration file in prisma/migrations/
#    - Apply the migration to your database
#    - Generate Prisma Client
```

**For existing production databases:**
```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

### Step 2: Verify Database Tables Were Created

Verify the tables exist:

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

**Check for:**
- ✅ `tax_pnl_uploads` table exists
- ✅ `tax_pnl_holdings` table exists
- ✅ Both tables are empty (ready for data)

You can also verify in your database admin tool (Supabase Dashboard, pgAdmin, etc.)

---

### Step 3: Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the next available port).

---

### Step 4: Access the Tax P&L Analyser

1. **Navigate to the module:**
   - Open your browser and go to `http://localhost:3000`
   - Log in to your account
   - Click on **"Tax P&L Analyser"** in the sidebar (or press `t` for shortcut)

2. **Alternative navigation:**
   - Direct URL: `http://localhost:3000/tax-pnl-analyser`
   - Keyboard shortcut: Press `t` key from anywhere in the dashboard

---

### Step 5: Upload Your Kite Holdings File

1. **Click "Upload Holdings" button** on the Tax P&L Analyser page

2. **Select Provider:**
   - Choose "Kite (Zerodha)" from the dropdown
   - (Other providers like Paytm Money will be available in future updates)

3. **Select Your File:**
   - Click "Choose File" or drag and drop
   - Select your Kite holdings Excel file (`.xlsx`, `.xls`, or `.csv`)
   - File should be from Zerodha Kite (e.g., `holdings-YU1142.xlsx`)

4. **Upload:**
   - Click "Upload" button
   - Wait for processing (you'll see a loading indicator)
   - Success message will show: "File uploaded successfully! Processed X holdings."

---

### Step 6: View Your Holdings Analysis

After upload, you'll see:

1. **Summary Cards** (top of page):
   - Total Holdings count
   - Long Term Holdings count and percentage
   - Total P&L (profit/loss)
   - Estimated Tax Savings

2. **Holdings Table:**
   - All your holdings with details:
     - Symbol (with "LT" badge for long-term)
     - Quantity
     - Average Price
     - Current Price
     - Purchase Date
     - Holding Period (e.g., "1Y 2M")
     - P&L (green for profit, red for loss)
     - P&L Percentage
     - Long Term indicator

3. **Filters:**
   - Toggle between "All Holdings" and "Long Term Only"
   - Use the dropdown to view specific uploads

---

### Step 7: Compare Different Uploads (Optional)

To compare holdings from different time periods:

1. **Upload multiple files** at different times (e.g., monthly snapshots)

2. **Select uploads to compare:**
   - Use the upload selector dropdown to view specific uploads
   - Or navigate to a comparison view (if implemented)

3. **View changes:**
   - See which holdings were added/removed
   - Track P&L changes over time
   - Monitor long-term holdings growth

---

## Understanding the Results

### Long-Term Holdings
- **Definition:** Holdings held for more than 365 days (1 year)
- **Tax Benefit:** In India, long-term capital gains on equity are:
  - Tax-free up to ₹1 lakh (100,000 INR)
  - 10% tax on gains above ₹1 lakh
- **Indicator:** Holdings with "LT" badge and "Yes" in Long Term column

### P&L Calculation
- **P&L = (Current Price - Average Price) × Quantity**
- **Green:** Profit (positive P&L)
- **Red:** Loss (negative P&L)

### Tax Savings Estimate
- Calculated based on long-term holdings with positive P&L
- Shows potential tax savings if you sell long-term holdings
- Formula: `(Long-term gains - ₹1 lakh exemption) × 10%`

---

## Troubleshooting

### Error: "Equity sheet not found in the file"
**Solution:** Make sure you're uploading the correct Kite holdings file. The file should have an "Equity" sheet.

### Error: "Could not find header row in the file"
**Solution:** The file format might be different. Ensure you're using the latest holdings export from Kite.

### Error: "Vault not selected"
**Solution:** Make sure you have a vault selected in the application. Create one if needed.

### Tables not created
**Solution:** 
1. Check your database connection in `.env` file
2. Verify `SUPABASE_DB_URL` is set correctly
3. Run `npm run dbpush` again
4. Check Prisma Studio: `npx prisma studio`

### File upload fails
**Solution:**
1. Check file size (max 10MB)
2. Ensure file is `.xlsx`, `.xls`, or `.csv`
3. Check browser console for errors
4. Verify you have write permissions for the vault

---

## Next Steps

- **Upload regularly:** Upload monthly snapshots to track changes
- **Compare versions:** Use the comparison feature to see portfolio evolution
- **Plan tax strategy:** Use long-term holdings list to plan tax-efficient selling
- **Export data:** Use the table export feature to save analysis

---

## File Format Reference

### Kite Holdings File Structure
The parser expects a Kite Excel file with:
- Sheet named "Equity"
- Header row with columns: Symbol, ISIN, Sector, Quantity Available, Quantity Long Term, Average Price, Previous Closing Price, Unrealized P&L, Unrealized P&L Pct.
- Data rows starting after the header

**Example file location:**
- Desktop: `holdings-YU1142 (1).xlsx`
- Or from Kite: Download from Reports → Holdings → Export

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database connection
3. Ensure all dependencies are installed: `npm install`
4. Check that Prisma Client is generated: `npx prisma generate`

---

**Happy analyzing! 📊💰**

