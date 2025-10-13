# Vercel Deployment Guide for Custom Expense.fyi

## 🚀 Deployment Steps

### 1. Configure Vercel Project Settings

In your Vercel dashboard for the project:

1. Go to **Settings** > **Domains**
2. Add these custom domains:
   - `solaiexp.vercel.app` (already added)
   - `app.solaiexp.vercel.app` (add this for subdomain support)

### 2. Environment Variables

Copy all environment variables from `.env.vercel` to your Vercel project:

1. Go to **Settings** > **Environment Variables**
2. Add each variable from the `.env.vercel` file:

```bash

```

### 3. Deploy

Push your changes to trigger a new deployment:

```bash
git add .
git commit -m "Configure for Vercel subdomain deployment"
git push
```

## 🔗 URLs After Deployment

- **Main site**: https://solaiexp.vercel.app
- **App dashboard**: https://app.solaiexp.vercel.app
- **Sign in**: https://app.solaiexp.vercel.app/signin
- **Sign up**: https://app.solaiexp.vercel.app/signup

## ✅ Changes Made

### 1. **Dynamic URL Configuration**
- Updated `constants/url.ts` to use environment variables
- URLs are now generated dynamically based on deployment context

### 2. **Vercel Configuration**
- Added `vercel.json` with subdomain rewrites
- Configured proper headers for security

### 3. **Middleware Updates**
- Enhanced middleware to handle app subdomain routing
- Improved session management for subdomains

### 4. **Environment Variables**
- Updated `NEXT_PUBLIC_SITE_URL` to use your domain
- Added `.env.vercel` for easy Vercel setup

### 5. **Build Configuration**
- Updated Next.js config for new domains
- Enhanced CSP headers for Vercel domains

### 6. **SEO Updates**
- Dynamic sitemap generation
- Updated robots.txt with dynamic URLs

## 🛠️ How It Works

1. **Main Domain** (`solaiexp.vercel.app`): Serves the landing page
2. **App Subdomain** (`app.solaiexp.vercel.app`): 
   - Automatically rewrites to `/dashboard/*` routes
   - Handles authentication flows
   - Maintains separate session context

## 🔧 Troubleshooting

If the app subdomain doesn't work:

1. **Check Domain Configuration**: Ensure `app.solaiexp.vercel.app` is added in Vercel domains
2. **Verify Environment Variables**: All variables should be set in Vercel
3. **Check Deployment Logs**: Look for any build or runtime errors
4. **DNS Propagation**: Wait a few minutes for DNS changes to propagate

## 📱 Testing

After deployment, test these URLs:
- ✅ https://solaiexp.vercel.app (landing page)
- ✅ https://app.solaiexp.vercel.app (redirects to sign-in if not authenticated)
- ✅ https://app.solaiexp.vercel.app/signin (sign-in page)
- ✅ https://app.solaiexp.vercel.app/signup (sign-up page)