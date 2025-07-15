# Security Setup Guide

## 🚨 CRITICAL: Immediate Actions Required

Your application currently has **exposed API keys** that need to be secured immediately.

### 1. Create Environment File

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp env.example .env.local
```

### 2. Configure Your Environment Variables

Edit `.env.local` with your actual values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### 3. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll to "Your apps" section
5. Copy the configuration values

### 4. Get Your Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Places API
3. Create credentials (API Key)
4. Restrict the API key to Places API only

## 🔒 What's Secure vs. What's Not

### ✅ Normal & Expected (Client-Side)
- All your React/Next.js source code being visible in browser dev tools
- Client-side JavaScript being readable
- `NEXT_PUBLIC_` environment variables being visible (these are meant to be public)

### ❌ Security Risks (Fixed)
- ~~Hardcoded API keys in source code~~ ✅ Fixed
- ~~Server-side secrets exposed to client~~ ✅ Fixed

### 🔐 Server-Side Secrets (Keep Private)
- Database connection strings
- JWT secrets
- Admin API keys
- Payment processing keys
- Any non-`NEXT_PUBLIC_` environment variables

## 🛡️ Security Best Practices

### Environment Variables
- ✅ Use `.env.local` for local development
- ✅ Use environment variables in production (Vercel, Netlify, etc.)
- ✅ Never commit `.env.local` to git
- ✅ Use `NEXT_PUBLIC_` prefix only for client-side variables

### API Keys
- ✅ Store server-side keys as regular environment variables
- ✅ Use `NEXT_PUBLIC_` only for client-side Firebase config
- ✅ Restrict API keys to specific domains/IPs
- ✅ Rotate keys regularly

### Code Security
- ✅ Remove console.log statements in production
- ✅ Validate all user inputs
- ✅ Use HTTPS in production
- ✅ Implement proper authentication/authorization

## 🚀 Deployment Security

### Vercel
```bash
# Set environment variables in Vercel dashboard
# or use vercel CLI
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add GOOGLE_PLACES_API_KEY
```

### Other Platforms
- Set environment variables in your hosting platform's dashboard
- Ensure `.env.local` is in `.gitignore`

## 🔍 Verification

After setup, verify security:

1. **Check browser dev tools**: Only `NEXT_PUBLIC_` variables should be visible
2. **Test API routes**: Ensure they work with environment variables
3. **Check git**: Ensure `.env.local` is not committed

## 📞 Need Help?

If you encounter issues:
1. Check that all environment variables are set
2. Verify Firebase project configuration
3. Ensure Google Places API is enabled
4. Check browser console for errors

## 🎯 Next Steps

1. ✅ Create `.env.local` with your actual values
2. ✅ Test the application locally
3. ✅ Deploy with proper environment variables
4. ✅ Monitor for any security issues

Remember: **Never commit API keys to version control!** 