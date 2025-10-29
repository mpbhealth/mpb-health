import 'dotenv/config';

const {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
} = process.env;

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: 'MPB Health',
    slug: 'mpb-health',
    version: '1.2.1',                 // ⬅️ bumped
    orientation: 'portrait',
    scheme: 'mpbhealth',
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mpb.health',
      buildNumber: '127',             // ⬅️ bumped (must strictly increase)
      associatedDomains: [
        'applinks:mpb.health',
        'applinks:*.supabase.co',
      ],
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSCameraUsageDescription: 'Allow MPB Health to access your camera.',
        NSPhotoLibraryUsageDescription: 'Allow MPB Health to access your photos.',
        NSPhotoLibraryAddUsageDescription: 'Allow MPB Health to save photos.',
        UIViewControllerBasedStatusBarAppearance: false,
        UIStatusBarStyle: 'default',
        LSApplicationQueriesSchemes: ['tel', 'telprompt', 'mailto'],
      },
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
    android: {
      package: 'com.mpb.health',
      versionCode: 127,               // ⬅️ bumped (must strictly increase)
      targetSdkVersion: 35,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      softwareKeyboardLayoutMode: 'resize',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'mpbhealth' },
            { scheme: 'https', host: 'mpb.health', pathPrefix: '/reset-password' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'tel' }, { scheme: 'mailto' }],
        },
      ],
      permissions: [
        'CAMERA',
        'INTERNET',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow MPB Health to access your camera.',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    extra: {
      router: { origin: 'https://mpb.health' },
      eas: { projectId: '42a4fb10-d825-47aa-ac99-b6fff4971f3f' },
      supabaseUrl: EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/42a4fb10-d825-47aa-ac99-b6fff4971f3f',
    },
    runtimeVersion: { policy: 'appVersion' }, // this will follow expo.version
    owner: 'mpbhealth',
  },
});
