# MPB Health App - Store Deployment Checklist

## Pre-Deployment Requirements Status

### ✅ Completed
- [x] EAS Build configuration added (eas.json)
- [x] Privacy manifest for iOS added
- [x] Environment variables secured (.gitignore updated)
- [x] Deep linking configured
- [x] Bundle identifiers set (com.mpb.health)
- [x] Version numbers configured (v1.2.1, build 127)
- [x] Camera permissions configured
- [x] Associated domains configured
- [x] dotenv package added

### ⚠️ Action Required

#### 1. Create App Icons and Splash Screens
You need to create the following assets:

**Required Files:**
- `assets/images/icon.png` (1024x1024px, PNG, no transparency)
- `assets/images/splash.png` (1284x2778px recommended)
- `assets/images/adaptive-icon.png` (1024x1024px, Android adaptive icon)

**Quick Solution:**
Use an online tool or design software to create these from your brand assets.

#### 2. Fix NPM Security Vulnerabilities
```bash
# Option 1: Upgrade to Expo SDK 51+ (recommended but breaking changes)
npm audit fix --force

# Option 2: Accept current vulnerabilities (dev-only packages)
# Most vulnerabilities are in webpack-dev-server (dev only)
```

#### 3. Setup EAS Account
```bash
npm install -g eas-cli
eas login
eas build:configure
```

#### 4. Update EAS Configuration
Edit `eas.json` and update:
- iOS: Add your Apple ID, ASC App ID, and Apple Team ID
- Android: Add path to your Google Play service account key

#### 5. Create Privacy Policy
- Host privacy policy at: https://mpb.health/privacy-policy
- Ensure it covers:
  - Health data collection
  - Camera usage
  - Supabase data storage
  - User authentication

#### 6. Prepare Store Listings
See `app-store-assets/README.md` for complete requirements including:
- Screenshots (multiple device sizes)
- App descriptions
- Keywords
- Support URLs

## Building for Production

### iOS Build
```bash
# Production build
eas build --platform ios --profile production

# After build completes, submit to App Store
eas submit --platform ios --profile production
```

**iOS Requirements:**
- Apple Developer Account ($99/year)
- App Store Connect app created
- Bundle ID registered: com.mpb.health
- Provisioning profiles and certificates (EAS handles automatically)

### Android Build
```bash
# Production build (AAB for Play Store)
eas build --platform android --profile production

# After build completes, submit to Play Store
eas submit --platform android --profile production
```

**Android Requirements:**
- Google Play Developer Account ($25 one-time)
- App created in Play Console
- Service account JSON key for automated submission

## Environment Variables for Production

Before building, ensure your `.env` file has production values:

```
EXPO_PUBLIC_SUPABASE_URL=https://qfigouszitcddkhssqxr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Security Note:** The .env file is now in .gitignore. Use EAS Secrets for production:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://qfigouszitcddkhssqxr.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
```

## Store-Specific Requirements

### iOS App Store
- [ ] App icon (1024x1024px)
- [ ] Screenshots for all required device sizes
- [ ] Privacy policy URL
- [ ] App description and keywords
- [ ] Support email and URL
- [ ] Age rating (set to Medical/Treatment Information)

### Google Play Store
- [ ] App icon (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshots for phone and tablet
- [ ] Privacy policy URL
- [ ] App description and keywords
- [ ] Content rating questionnaire
- [ ] Target audience selection

## Testing Before Submission

### Internal Testing
```bash
# Build preview version for internal testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Pre-Launch Checklist
- [ ] Test authentication flow
- [ ] Test deep links (password reset, email verification)
- [ ] Test camera permissions
- [ ] Test on multiple device sizes
- [ ] Verify all WebView integrations work
- [ ] Test offline behavior
- [ ] Verify Supabase connection
- [ ] Test payment flows (if applicable)

## Version Management

When releasing updates:

1. Update version in `app.config.js`:
   - Increment `version` (semantic versioning: X.Y.Z)
   - Increment `buildNumber` (iOS) - must always increase
   - Increment `versionCode` (Android) - must always increase

2. Current version: 1.2.1 (build 127)
3. Next update should be: 1.2.2 (build 128) or 1.3.0 (build 128)

## Support Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [iOS Submission Guide](https://docs.expo.dev/submit/ios/)
- [Android Submission Guide](https://docs.expo.dev/submit/android/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://support.google.com/googleplay/android-developer/topic/9858052)

## Troubleshooting

### Build Failures
- Check EAS build logs for specific errors
- Verify all dependencies are compatible with Expo SDK 50
- Ensure native modules are properly configured

### Submission Rejections
- Review store rejection reason carefully
- Common issues: missing privacy policy, inadequate screenshots, permission descriptions
- Address feedback and resubmit

## Next Steps

1. Create app icons and splash screens
2. Install EAS CLI and login
3. Run a preview build to test
4. Create store listings
5. Submit for review
