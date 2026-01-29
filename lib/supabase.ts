import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Prefer build-time extras (from app.config.js / eas), fall back to process.env
const extras = (Constants.expoConfig && Constants.expoConfig.extra) || {};
const supabaseUrlCandidate = extras.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyCandidate = extras.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function makeUnavailableProxy(err: Error) {
  const message = `Supabase client unavailable: ${err.message}`;
  // Any property access on this proxy throws a helpful error so app doesn't crash during module init
  return new Proxy(
    {},
    {
      get() {
        throw new Error(message);
      },
      apply() {
        throw new Error(message);
      },
    }
  );
}

let supabase: any;
let _supabaseInitializationError: Error | null = null;

try {
  if (!supabaseUrlCandidate || !supabaseAnonKeyCandidate) {
    throw new Error('Missing Supabase environment variables (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  }

  // Basic validation of URL
  try {
    const parsed = new URL(String(supabaseUrlCandidate));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('supabaseUrl protocol must be http(s)');
    }
  } catch (err: any) {
    throw new Error(`Invalid supabaseUrl: ${String(err?.message ?? err)}`);
  }

  console.log('Supabase URL:', supabaseUrlCandidate);
  console.log('Supabase Key exists:', !!supabaseAnonKeyCandidate);

  supabase = createClient(String(supabaseUrlCandidate), String(supabaseAnonKeyCandidate), {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
      ...(Platform.OS === 'ios' && {
        storageKey: 'mpb-health-auth',
        debug: __DEV__,
      }),
    },
    global: {
      headers: {
        'X-Client-Info': `mpb-health-${Platform.OS}`,
        ...(Platform.OS === 'ios' && {
          'User-Agent': 'MPBHealth/1.0 iOS',
        }),
      },
    },
    realtime: {
      params: {
        eventsPerSecond: Platform.OS === 'ios' ? 5 : 10,
      },
    },
  });
} catch (err: any) {
  // Don't crash the JS VM during module initialization — export a proxy that surfaces a clear error when used.
  // Log to console for easier debugging in builds.
  const e = err instanceof Error ? err : new Error(String(err));
  console.warn('[supabase] initialization failed:', e.message);
  _supabaseInitializationError = e;
  supabase = makeUnavailableProxy(e);
}

function isSupabaseAvailable(): boolean {
  return _supabaseInitializationError === null;
}

function getSupabaseInitializationError(): Error | null {
  return _supabaseInitializationError;
}

export { supabase, isSupabaseAvailable, getSupabaseInitializationError };