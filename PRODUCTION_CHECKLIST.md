# Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env` to `.env.production` and update production values
- [ ] Verify `EXPO_PUBLIC_SUPABASE_URL` points to production Supabase instance
- [ ] Verify `EXPO_PUBLIC_SUPABASE_ANON_KEY` is production anon key
- [ ] Ensure no development/test credentials are in production config

### 2. Code Quality & Security
- [x] All console.log statements replaced with logger service
- [x] Production logging enabled (errors/warnings only)
- [x] Email normalization implemented (case-insensitive)
- [x] Error boundaries in place
- [x] RLS policies enabled on all tables
- [x] No hardcoded secrets in code

### 3. Database
- [x] All migrations applied
- [x] RLS policies verified and tested
- [x] Email lowercase triggers active
- [x] Foreign keys and constraints in place
- [x] Indexes optimized for queries

### 4. Performance
- [x] Real-time subscription manager implemented
- [x] Connection pooling for real-time channels
- [ ] Test on actual iOS/Android devices
- [ ] Profile memory usage
- [ ] Test with slow network conditions

### 5. App Store Preparation

#### iOS (App Store Connect)
- [ ] Update `app.config.js` version and buildNumber
- [ ] Verify bundleIdentifier: `com.mpb.health`
- [ ] Test on multiple iOS devices (iPhone/iPad)
- [ ] Screenshots for all required device sizes
- [ ] App Store description and keywords ready
- [ ] Privacy policy URL set
- [ ] App review information prepared

#### Android (Google Play Console)
- [ ] Update `app.config.js` version and versionCode
- [ ] Verify package name: `com.mpb.health`
- [ ] Test on multiple Android devices/versions
- [ ] Generate signed APK/AAB
- [ ] Screenshots for all required device sizes
- [ ] Store listing prepared
- [ ] Privacy policy URL set

### 6. Build & Test
```bash
# Install dependencies
npm install

# Run TypeScript check
npx tsc --noEmit

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 7. Monitoring (Optional but Recommended)
- [ ] Set up Sentry or similar error monitoring
- [ ] Configure crash reporting
- [ ] Set up analytics (if needed)
- [ ] Configure push notifications (if needed)

## 📱 Device Testing Requirements

### iOS Testing
- [ ] iPhone SE (small screen)
- [ ] iPhone 13/14/15 (standard)
- [ ] iPhone 14/15 Pro Max (large screen)
- [ ] iPad (tablet support)
- [ ] Test with iOS 13, 14, 15, 16, 17, 18

### Android Testing
- [ ] Small phone (5.0" - 5.5")
- [ ] Standard phone (6.0" - 6.5")
- [ ] Large phone (6.5"+)
- [ ] Tablet (10"+)
- [ ] Test with Android 5.0 (API 21) minimum
- [ ] Test with latest Android version

## 🔍 Functional Testing

### Authentication Flow
- [ ] Sign up with new member
- [ ] Sign in with existing user
- [ ] Sign out
- [ ] Password reset flow
- [ ] Email change flow
- [ ] Password change flow
- [ ] Deep linking (password reset emails)

### Core Features
- [ ] Home dashboard loads correctly
- [ ] All tabs navigate properly
- [ ] Member forms display and work
- [ ] Labs testing loads from database
- [ ] Care services load with product filtering
- [ ] Discount services load with codes
- [ ] WebViews load external URLs
- [ ] Profile settings work
- [ ] Chat/concierge access

### Edge Cases
- [ ] No internet connection handling
- [ ] Slow network conditions
- [ ] App backgrounding/foregrounding
- [ ] Session expiration handling
- [ ] Invalid/expired tokens
- [ ] Database connection issues

## 🚀 Deployment Steps

### 1. Final Code Review
```bash
# Ensure clean build
npm run build:web

# Check for TypeScript errors
npx tsc --noEmit

# Run tests (if available)
npm test
```

### 2. Build Production Apps
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 3. Submit to Stores
```bash
# iOS - Submit to App Store
eas submit --platform ios

# Android - Submit to Google Play
eas submit --platform android
```

### 4. Post-Deployment
- [ ] Monitor error logs for first 24-48 hours
- [ ] Watch for crash reports
- [ ] Monitor Supabase usage/performance
- [ ] Respond to initial user feedback
- [ ] Be ready to push hotfix if critical issues arise

## 📊 Success Metrics

### Technical
- Crash rate < 1%
- Average app load time < 3 seconds
- API response times < 500ms
- Real-time sync lag < 1 second

### User Experience
- Sign-up completion rate > 80%
- Session length (engagement)
- Feature usage statistics
- User retention rate

## 🔧 Rollback Plan

If critical issues occur:
1. Pull app from stores (if necessary)
2. Fix issue in codebase
3. Test thoroughly
4. Increment version numbers
5. Rebuild and resubmit

## 📞 Support Contacts

- **Development Team**: [Contact Info]
- **Supabase Support**: support@supabase.io
- **Expo Support**: support@expo.dev
- **App Store Support**: [Apple Developer Support]
- **Google Play Support**: [Google Play Console Support]

---

**Last Updated**: 2025-10-28
**App Version**: 1.2.1
**Build Number**: 127
