// app/_layout.tsx

// Supabase / React Native polyfills: MUST come first.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Polyfill for structuredClone if not available
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function (obj: any) {
    return JSON.parse(JSON.stringify(obj));
  };
}

import React, { useEffect } from 'react';
import { View, Platform, LogBox, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';

// Suppress known warnings and expected errors (push modules missing in Expo Go / dev client without rebuild)
LogBox.ignoreLogs([
  'may be overwritten by a layout animation',
  'missing the required default export',
  'ViewPropTypes',
  "Cannot find native module 'ExpoPushTokenManager'",
  "Cannot find native module 'ExpoDevice'",
]);
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useDeferredBusyIndicator } from '@/hooks/useDeferredBusyIndicator';
import { routerPushSafe, routerReplaceSafe } from '@/utils/navigation';
import { useScreenOrientationLock } from '@/hooks/useScreenOrientationLock';
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';
import { colors } from '@/constants/theme';
import { applyAccessibleTextDefaults } from '@/utils/applyAccessibleTextDefaults';
import { HealthWalletPortal } from '@/components/health-wallet/HealthWalletPortal';
import { HealthWalletVisibilityProvider } from '@/contexts/HealthWalletVisibilityContext';

applyAccessibleTextDefaults();

// Show push notifications as banners even when the app is in the foreground
try {
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (!isExpoGo) {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'MPB Health',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0071BC',
        sound: 'default',
      });
    }
  }
} catch {}

// Module-level: survive component remounts (sign-out/sign-in don't reset these)
let _coldStartHandled = false;
const _handledNotificationIds = new Set<string>();
const MAX_HANDLED_IDS = 50;

export default function RootLayout() {
  const { session, loading, signOut } = useAuth();
  const showLoadingChrome = useDeferredBusyIndicator(loading, 260);
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  useFrameworkReady();
  useScreenOrientationLock(screenWidth);
  usePushTokenRegistration(session?.user?.id);

  // Handle push notification taps — navigate to route and mark as read
  const handleNotificationResponse = React.useCallback(
    (response: any, isColdStart = false) => {
      if (!session?.user?.id) return;

      const requestId = response?.notification?.request?.identifier;
      if (requestId && _handledNotificationIds.has(requestId)) return;
      if (requestId) {
        if (_handledNotificationIds.size >= MAX_HANDLED_IDS) {
          const first = _handledNotificationIds.values().next().value;
          if (first) _handledNotificationIds.delete(first);
        }
        _handledNotificationIds.add(requestId);
      }

      if (isColdStart) {
        const notifDate = response?.notification?.date;
        if (notifDate) {
          // Android gives seconds, iOS gives milliseconds
          const dateMs = notifDate < 1e12 ? notifDate * 1000 : notifDate;
          const age = Date.now() - dateMs;
          if (age > 30_000) return;
        }
      }

      const content = response?.notification?.request?.content;
      const data = content?.data as Record<string, any> | undefined;
      const notificationId = data?.notificationId ?? data?.notification_id;
      const userId = session.user.id;
      const pathToOpen =
        notificationId != null
          ? `/notification-detail?id=${notificationId}`
          : '/notifications';
      logger.debug('Push notification tapped', { pathToOpen, notificationId });
      setTimeout(() => {
        routerPushSafe(router, pathToOpen, 'push notification tap');
      }, 500);
      if (notificationId) {
        supabase
          .from('notification_reads')
          .upsert(
            {
              notification_id: notificationId,
              user_id: userId,
              read_at: new Date().toISOString(),
            },
            { onConflict: 'notification_id,user_id' }
          )
          .then((result: { error: PostgrestError | null }) => {
            if (result.error) {
              logger.debug('Mark read failed', {
                message: result.error.message,
                code: result.error.code,
              });
            }
          });
      }
    },
    [session?.user?.id, router]
  );

  // Listener for real-time taps while app is running
  useEffect(() => {
    const isExpoGo =
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) return;
    let Notifications: typeof import('expo-notifications') | null = null;
    try {
      Notifications = require('expo-notifications');
    } catch {
      return;
    }
    if (!Notifications?.addNotificationResponseReceivedListener) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) =>
      handleNotificationResponse(response, false)
    );
    return () => sub.remove();
  }, [handleNotificationResponse]);

  // Cold-start: only once per app launch, only if tapped within 30s
  useEffect(() => {
    if (_coldStartHandled) return;
    if (!session?.user?.id) return;

    _coldStartHandled = true;

    const isExpoGo =
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) return;
    let Notifications: typeof import('expo-notifications') | null = null;
    try {
      Notifications = require('expo-notifications');
    } catch {
      return;
    }
    if (!Notifications?.getLastNotificationResponseAsync) return;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response, true);
      }
    });
  }, [session?.user?.id, handleNotificationResponse]);

  // Deep-linking handler
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      logger.debug('Deep link received', { url });
      if (url.includes('type=recovery')) {
        logger.debug('Navigating to reset-password (type=recovery)');
        setTimeout(() => {
          routerPushSafe(router, '/auth/reset-password', 'deep link recovery');
        }, 500);
      } else if (url.includes('type=email_change')) {
        logger.debug('Navigating to email-confirm (type=email_change)');
        setTimeout(() => {
          routerPushSafe(router, '/auth/email-confirm', 'deep link email_change');
        }, 500);
      } else if (url.includes('reset-password')) {
        logger.debug('Navigating to reset-password (direct link)');
        setTimeout(() => {
          routerPushSafe(router, '/auth/reset-password', 'deep link reset-password');
        }, 500);
      }
    };

    const checkInitial = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) handleDeepLink(url);
      } catch (err) {
        logger.error('Error getting initial URL', err);
      }
    };

    checkInitial();
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => {
      subscription.remove?.();
    };
  }, [router]);

  // Session validation
  useEffect(() => {
    if (loading) return;

    const validate = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          await signOut();
          routerReplaceSafe(router, '/auth/sign-in', 'session missing user');
          return;
        }

        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (dbError || !dbUser) {
          await signOut();
          routerReplaceSafe(router, '/auth/sign-in', 'session db user missing');
        }
      } catch (err) {
        logger.error('Session validation failed', err);
        await signOut();
        routerReplaceSafe(router, '/auth/sign-in', 'session validate exception');
      }
    };

    if (!session) {
      setTimeout(() => routerReplaceSafe(router, '/auth/sign-in', 'no session'), 100);
    } else {
      validate();
    }
  }, [loading, session, signOut, router]);

  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: colors.background.paper }}>
            {showLoadingChrome ? <LoadingIndicator /> : null}
            <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
          </View>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <HealthWalletVisibilityProvider>
            <View style={{ flex: 1, backgroundColor: colors.background.default }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  contentStyle: { backgroundColor: colors.background.default },
                }}
              >
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    gestureEnabled: false,
                    animation: 'none',
                  }}
                />

                <Stack.Screen name="payment-history" options={{ headerShown: false }} />

                <Stack.Screen
                  name="health-wallet"
                  options={{
                    headerShown: false,
                    gestureEnabled: false,
                  }}
                />

                <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="profile-settings" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
              </Stack>
              <HealthWalletPortal />
              <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
            </View>
          </HealthWalletVisibilityProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
