import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
    // iOS-specific settings
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
  // iOS-specific realtime settings
  realtime: {
    params: {
      eventsPerSecond: Platform.OS === 'ios' ? 5 : 10,
    },
  },
});