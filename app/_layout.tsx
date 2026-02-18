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

// Suppress known warnings so the console stays quiet during development
LogBox.ignoreLogs([
  '[expo-av]: Expo AV has been deprecated',
  'may be overwritten by a layout animation',
  'missing the required default export', // expo-router sometimes flags _layout during HMR
  'ViewPropTypes',
]);
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useScreenOrientationLock } from '@/hooks/useScreenOrientationLock';

export default function RootLayout() {
  const { session, loading, signOut } = useAuth();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  useFrameworkReady();
  useScreenOrientationLock(screenWidth);

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
