# Dynamic Configuration Environment Variables

## Overview
The application now supports dynamic configuration through environment variables. This allows you to customize the app name, branding, and domain for different deployments (e.g., `solaiexp.vercel.app`).

## Required Environment Variables

### Basic Configuration
```bash
# App Branding
NEXT_PUBLIC_APP_NAME="Solaiexp.fyi"                    # App name (defaults to domain-based name)
NEXT_PUBLIC_APP_SHORT_NAME="Solaiexp"                  # Short app name
NEXT_PUBLIC_APP_TAGLINE="Track your expenses with ease" # App tagline
NEXT_PUBLIC_APP_DESCRIPTION="Effortlessly Track and Manage Expenses." # App description

# Domain Configuration
NEXT_PUBLIC_SITE_URL="https://solaiexp.vercel.app"     # Your production domain
NEXT_PUBLIC_SITE_PORT="3000"                           # Local development port

# Contact Information
NEXT_PUBLIC_SUPPORT_EMAIL="support@solaiexp.vercel.app" # Support email
NEXT_PUBLIC_CONTACT_EMAIL="hello@solaiexp.vercel.app"   # Contact email

# Social Links
NEXT_PUBLIC_GITHUB_URL="https://github.com/yourusername/solaiexp" # Your GitHub repo
NEXT_PUBLIC_TWITTER_URL="https://twitter.com/yourusername"        # Your Twitter

# Author Information
NEXT_PUBLIC_AUTHOR_NAME="Your Name"                    # Your name
NEXT_PUBLIC_AUTHOR_TWITTER="@yourusername"             # Your Twitter handle
```

### Database Configuration (Required)
```bash
# Supabase Configuration
SUPABASE_DB_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
SHADOW_DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
```

### Email Configuration (Required)
```bash
# Resend Email Service
RESEND_API_KEY="[your-resend-api-key]"
```

### Analytics (Optional)
```bash
# Google Analytics
GA4_ANALYTICS_ID="[your-ga4-id]"
```

## How It Works

### Automatic Domain Detection
- **Production**: Uses `NEXT_PUBLIC_SITE_URL` or detects from current domain
- **Development**: Uses `localhost:3000` (or custom port)
- **App Name**: Automatically extracts from domain (e.g., "solaiexp" from "solaiexp.vercel.app")

### Fallback Behavior
If environment variables are not set, the app will:
1. Use the current domain to generate app name
2. Use default values for branding
3. Use default contact information

## Example Configurations

### For `solaiexp.vercel.app`
```bash
NEXT_PUBLIC_APP_NAME="Solaiexp.fyi"
NEXT_PUBLIC_APP_SHORT_NAME="Solaiexp"
NEXT_PUBLIC_SITE_URL="https://solaiexp.vercel.app"
NEXT_PUBLIC_SUPPORT_EMAIL="support@solaiexp.vercel.app"
NEXT_PUBLIC_CONTACT_EMAIL="hello@solaiexp.vercel.app"
NEXT_PUBLIC_GITHUB_URL="https://github.com/yourusername/solaiexp"
NEXT_PUBLIC_AUTHOR_NAME="Your Name"
NEXT_PUBLIC_AUTHOR_TWITTER="@yourusername"
```

### For `myexpense.app`
```bash
NEXT_PUBLIC_APP_NAME="MyExpense"
NEXT_PUBLIC_APP_SHORT_NAME="MyExpense"
NEXT_PUBLIC_SITE_URL="https://myexpense.app"
NEXT_PUBLIC_SUPPORT_EMAIL="support@myexpense.app"
NEXT_PUBLIC_CONTACT_EMAIL="hello@myexpense.app"
NEXT_PUBLIC_GITHUB_URL="https://github.com/yourusername/myexpense"
NEXT_PUBLIC_AUTHOR_NAME="Your Name"
NEXT_PUBLIC_AUTHOR_TWITTER="@yourusername"
```

## Deployment Instructions

### Vercel Deployment
1. Set all environment variables in Vercel Dashboard → Project Settings → Environment Variables
2. Deploy your application
3. The app will automatically use your custom branding

### Local Development
1. Create a `.env.local` file with your configuration
2. Run `npm run dev`
3. The app will use your local configuration

## Testing the Configuration

After setting up environment variables, verify:
1. **App Name**: Check the header/title shows your custom name
2. **URLs**: All links should point to your domain
3. **Emails**: Support emails should use your custom email
4. **Social Links**: GitHub/Twitter links should point to your accounts

## Files Updated

The following files now use dynamic configuration:
- `lib/config.ts` - Main configuration system
- `constants/url.ts` - URL generation
- `constants/messages.ts` - Email messages
- `app/layout.tsx` - Metadata and titles
- `app/page.tsx` - Home page branding
- `components/sidebar/index.tsx` - Sidebar branding
- `components/footer.tsx` - Footer branding

## Benefits

✅ **Multi-tenant Ready**: Deploy to multiple domains with different branding
✅ **Easy Customization**: Change branding without code changes
✅ **Automatic Detection**: Works with any domain automatically
✅ **Fallback Support**: Graceful degradation if env vars not set
✅ **SEO Friendly**: Dynamic metadata for each deployment



நா மணிகண்டன்

நாகந்திரன்

8/476ஏ, காந்தி தெரு

வசந்தா டிபன் ஷாப்

விஜயநகரம்,  மேடவாக்கம்