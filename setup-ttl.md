# Firestore TTL Setup Instructions

To enable automatic deletion of messages after 10 minutes, you need to set up a Time-to-Live (TTL) policy in Firestore.

## Option 1: Using Google Cloud Console (Recommended)

1. Go to the [Firestore TTL Configuration page](https://console.cloud.google.com/firestore/ttl)
2. Select your project: `clubs-39030`
3. Click "Create Policy"
4. Configure the policy:
   - **Collection Group**: `messages`
   - **Field**: `expireAt`
   - **Description**: "Auto-delete messages after 10 minutes"
5. Click "Create"

## Option 2: Using gcloud CLI

```bash
gcloud firestore fields ttls update \
  --collection-group=messages \
  --field=expireAt \
  --enable-ttl
```

## Option 3: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `clubs-39030`
3. Go to Firestore Database
4. Click on "Rules" tab
5. Look for TTL configuration (if available in your region)

## How It Works

- Messages are created with an `expireAt` field set to 10 minutes from creation time
- Firestore automatically deletes documents when the current time exceeds the `expireAt` value
- This happens server-side, so no client-side code is needed
- Deleted messages are permanently removed and cannot be recovered

## Benefits for Stealth

- **Reduced digital footprint**: No permanent message history
- **Automatic cleanup**: No manual maintenance required
- **Evidence destruction**: Messages disappear automatically
- **Storage efficiency**: Prevents database bloat
- **Privacy enhancement**: Old conversations are automatically purged
