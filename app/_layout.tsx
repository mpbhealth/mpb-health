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
  '[expo-av]: Expo AV has been deprecated',
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
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useScreenOrientationLock } from '@/hooks/useScreenOrientationLock';
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';

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
        try {
          router.push(pathToOpen as never);
        } catch (e) {
          logger.debug('Push nav failed', e);
        }
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
          .then(({ error }) => {
            if (error) logger.debug('Mark read failed', error);
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
          router.push('/auth/reset-password');
        }, 500);
      } else if (url.includes('type=email_change')) {
        logger.debug('Navigating to email-confirm (type=email_change)');
        setTimeout(() => {
          router.push('/auth/email-confirm');
        }, 500);
      } else if (url.includes('reset-password')) {
        logger.debug('Navigating to reset-password (direct link)');
        setTimeout(() => {
          router.push('/auth/reset-password');
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
          router.replace('/auth/sign-in');
          return;
        }

        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (dbError || !dbUser) {
          await signOut();
          router.replace('/auth/sign-in');
        }
      } catch (err) {
        await signOut();
        router.replace('/auth/sign-in');
      }
    };

    if (!session) {
      setTimeout(() => router.replace('/auth/sign-in'), 100);
    } else {
      validate();
    }
  }, [loading, session, signOut, router]);

  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <LoadingIndicator message="Loading…" />
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
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
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

              <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="profile-settings" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
            <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
