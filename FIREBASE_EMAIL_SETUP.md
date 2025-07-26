# Firebase Email Verification Setup Guide

## Why Email Verification Links Expire

Firebase email verification links have a **1-hour expiration time** and can only be used **once**. This is a security feature to prevent unauthorized access.

## Current Issue

When you click the verification link, you see:
> "Your request to verify your email has expired or the link has already been used"

This is **normal behavior** and expected. Here's how to handle it:

## How to Complete Email Verification

### Option 1: Use the "I've Verified My Email" Button (Recommended)
1. Click the verification link in your email (even if it shows an error)
2. Return to the verification page
3. Click "I've Verified My Email" button
4. The system will check your verification status and proceed

### Option 2: Resend Verification Email
1. If the link doesn't work, click "Resend Verification Email"
2. Check your inbox for the new link
3. Click the new verification link
4. Return to the verification page and click "I've Verified My Email"

## Firebase Console Setup (For Admins)

To ensure email verification works properly, verify these settings in Firebase Console:

### 1. Authentication Settings
- Go to Firebase Console → Authentication → Settings
- Ensure your domain is added to "Authorized domains"
- Add `localhost` for development

### 2. Email Templates
- Go to Firebase Console → Authentication → Templates
- Customize the "Email verification" template if needed
- Ensure the template is enabled

### 3. Email Provider
- Go to Firebase Console → Authentication → Sign-in method
- Ensure "Email/Password" is enabled
- Check that "Email link (passwordless sign-in)" is configured if needed

## Troubleshooting

### If emails aren't being sent:
1. Check spam folder
2. Verify Firebase project settings
3. Check browser console for errors
4. Ensure Firebase configuration is correct

### If verification still doesn't work:
1. Try resending the verification email
2. Check if the user account exists in Firebase Console
3. Verify the email address is correct
4. Try signing up again with a different email

## Security Notes

- Verification links expire after 1 hour for security
- Each link can only be used once
- Multiple resend attempts may be rate-limited
- This is standard Firebase behavior and not a bug

## Development vs Production

- **Development:** Use `localhost` in authorized domains
- **Production:** Add your actual domain to authorized domains
- **Testing:** You can test with multiple email addresses 