/**
 * Registers the device's Expo push token with Supabase (push_tokens table)
 * so the backend can send push notifications. Registration requires:
 * 1. User grants notification permissions (requestPermissionsAsync)
 * 2. App receives the Expo push token (getExpoPushTokenAsync)
 * 3. Token is saved to the user's record (upsert into push_tokens with user_id)
 * Call when the user is signed in. No-ops when expo-notifications is unavailable (e.g. Expo Go).
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export function usePushTokenRegistration(userId: string | undefined) {
  const registered = useRef(false);

  useEffect(() => {
    if (!userId) {
      registered.current = false;
      return;
    }
    const uid = userId;
    const isExpoGo =
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) return; // Expo Go doesn't include push native module

    let cancelled = false;

    async function register() {
      let Notifications: typeof import('expo-notifications') | null = null;
      let Device: typeof import('expo-device') | null = null;
      try {
        Notifications = require('expo-notifications');
        Device = require('expo-device');
      } catch {
        return;
      }
      if (!Notifications || !Device) return;
      if (!Device.isDevice && Platform.OS === 'ios') {
        logger.debug('Push tokens require a physical device (iOS simulator not supported)');
        return;
      }

      try {
        logger.debug('Push registration: checking permissions…');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          if (status !== 'granted') {
            logger.debug('Push notification permission not granted');
            return;
          }
        }
        logger.debug('Push registration: permission granted', { finalStatus });

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        logger.debug('Push registration: projectId', { projectId: projectId ?? 'MISSING' });
        if (!projectId) {
          logger.warn('EAS projectId not found; push token may be invalid');
        }

        logger.debug('Push registration: requesting Expo push token…');
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId as string | undefined,
        });
        const expoPushToken = tokenData.data;
        logger.debug('Push registration: token received');

        if (cancelled) return;

        logger.debug('Push registration: upserting to push_tokens…');
        const { error } = await supabase.from('push_tokens').upsert(
          {
            user_id: uid,
            expo_push_token: expoPushToken,
            device_id: Constants.sessionId ?? null,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,expo_push_token',
          }
        );

        if (error) {
          logger.error('Failed to upsert push token', error);
          return;
        }
        registered.current = true;
        logger.debug('Push token registered successfully', { userId: uid });

        if (cancelled) return;
        await sendWelcomeNotificationIfNew(uid);
      } catch (err: unknown) {
        if (err !== null && err !== undefined) {
          logger.error('Push token registration failed', err);
        }
      }
    }

    register();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}

async function sendWelcomeNotificationIfNew(userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('send-welcome', {
      body: { user_id: userId },
    });

    if (error) {
      const msg = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      logger.warn('Welcome notification failed: ' + msg);
    } else {
      logger.debug('Welcome notification result', data);
    }
  } catch (err) {
    if (err !== null && err !== undefined) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('Welcome notification flow failed: ' + msg);
    }
  }
}
