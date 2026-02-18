# Deploy MPB Health to iOS Production

## Prerequisites

1. **Expo account** – You need an Expo account (sign up at [expo.dev](https://expo.dev)).
2. **EAS CLI** – Install and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Apple Developer account** – Active membership and App Store Connect access.
4. **Apple credentials** – EAS can manage them for you, or you can use a local `*.p12` and provisioning profile.

## 1. Build for production

From the project root:

```bash
npm run build:ios
```

Or directly:

```bash
eas build --platform ios --profile production
```

- Build runs on Expo’s servers (macOS/Xcode).
- Your `eas.json` production profile uses `distribution: "store"` and `autoIncrement: true` (build number is bumped automatically).
- When the build finishes, EAS prints a link to the build and the `.ipa` is available in your Expo dashboard.

## 2. Submit to App Store Connect

After a successful production build:

**Option A – Submit the latest build (recommended)**

```bash
npm run submit:ios
```

Or:

```bash
eas submit --platform ios --profile production --latest
```

**Option B – Submit a specific build**

```bash
eas submit --platform ios --profile production --id <BUILD_ID>
```

Get `<BUILD_ID>` from the build URL or from [expo.dev](https://expo.dev) → your project → Builds.

- First time: EAS will prompt for Apple ID and App Store Connect API key (or ask to create one). You can save credentials for later runs.
- The app is uploaded to App Store Connect. Then in [App Store Connect](https://appstoreconnect.apple.com) you create/select the app, set metadata, and submit for review.

## 3. App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your app (e.g. **MPB Health**, bundle ID `com.mpb.health`).
2. Create a new version or select the version that received the upload.
3. Fill in “What’s New”, screenshots, description, etc. if not already done.
4. Choose the build that was just submitted.
5. Submit for Review.

## Quick reference

| Step              | Command / action                          |
|-------------------|-------------------------------------------|
| Build iOS prod    | `npm run build:ios`                       |
| Submit latest     | `npm run submit:ios`                       |
| Check build status| Expo dashboard → project → Builds         |
| Submit for review | App Store Connect → version → Submit      |

## Environment

- Production build uses your `app.config.js` (and any env vars it reads, e.g. from `.env`).
- Ensure `.env` (or your production env) has the correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for production; EAS Build uses env from the machine or from EAS Secrets.

## EAS Secrets (optional)

To inject env vars on EAS Build:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
```

Then in `app.config.js` you can read from `process.env`; EAS will expose secrets as env vars during the build.
