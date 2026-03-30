import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image,
  ScrollView, KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { useAuth } from '@/hooks/useAuth';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { cardChromeSm, cardChromeLg, platformStyles } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!re.test(value)) return 'Please enter a valid email address';
    return null;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const checkNetworkConnectivity = async (): Promise<boolean> => {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      return response.status === 200 || response.status === 401 || response.status === 404;
    } catch {
      return false;
    }
  };

  const makeResetRequest = async (
    apiUrl: string,
    headers: Record<string, string>,
    body: string,
    attempt: number = 0
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeout = attempt === 0 ? 30000 : 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const isConnected = await checkNetworkConnectivity();

        if (!isConnected) {
          throw new Error('NO_NETWORK');
        }

        const delayMs = RETRY_DELAYS[attempt];
        setRetryMessage(`Connection issue detected. Retrying in ${delayMs / 1000} seconds...`);
        await delay(delayMs);
        setRetryMessage(null);

        return makeResetRequest(apiUrl, headers, body, attempt + 1);
      }

      throw err;
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(false);
    setRetryMessage(null);

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);

      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error('Service configuration error. Please contact support.');
      }

      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('NO_NETWORK');
      }

      const apiUrl = `${supabaseUrl}/functions/v1/reset-password`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const body = JSON.stringify({ email });

      const response = await makeResetRequest(apiUrl, headers, body);

      let responseData;
      try {
        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }

        responseData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse response:', parseErr);
        throw new Error('Invalid response from service. Please try again.');
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unable to process request. Please try again.');
        }

        if (response.status >= 500) {
          throw new Error('Service is temporarily unavailable. Please try again in a few minutes.');
        }

        throw new Error(responseData?.error || 'Failed to send reset email');
      }

      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format from service');
      }

      setSuccess(true);
      setEmail('');
      setRetryCount(0);

    } catch (err) {
      console.error('Reset password error:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof Error) {
        if (err.message === 'NO_NETWORK') {
          errorMessage = 'No internet connection detected. Please check your network and try again.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Connection timed out. Please check your internet connection and try again.';
        } else if (err.message.includes('Network request failed')) {
          errorMessage = 'Unable to reach service. Please check your connection and try again.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Invalid response from server. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
      setRetryMessage(null);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleResetPassword();
  };

  return (
    <KeyboardAvoidingView style={screenChrome.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={screenChrome.container}
        overScrollMode="never"
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerPaddingTop, paddingBottom: scrollContentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.content}>
          <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={styles.logoContainer}>
            <Image source={{ uri: 'https://i.postimg.cc/FRx3DWgd/logo.png' }} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={styles.formContainer} entering={FadeInDown.delay(200)}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.successContainer}>
                <AlertCircle size={20} color={colors.status.success} />
                <Text style={styles.successText}>
                  Check your email for a password reset link. The link will expire in 1 hour.
                </Text>
              </View>
            )}

            {retryMessage && (
              <View style={styles.retryContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.retryText}>{retryMessage}</Text>
              </View>
            )}

            {retryCount > 0 && !success && (
              <Text style={styles.attemptText}>
                Attempt {retryCount + 1} of {MAX_RETRY_ATTEMPTS}
              </Text>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : undefined]}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading && !success}
              />
            </View>

            {error && !isLoading ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color={colors.background.default} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.resetButton, (isLoading || success) && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background.default} />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Email</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.signInContainer} onPress={() => router.push('/auth/sign-in')}>
              <Text style={styles.signInText}>
                Remember your password? <Text style={styles.signInLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: spacing.lg },
  content: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },

  header: { marginBottom: spacing.xxl },
  backButton: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100], justifyContent: 'center', alignItems: 'center', ...cardChromeSm,
  },

  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 160, height: 45 },

  formContainer: {
    width: '100%', backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl, padding: spacing.xl, ...cardChromeLg,
  },
  title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body1, color: colors.text.secondary, marginBottom: spacing.xxl, lineHeight: 24 },

  errorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: `${colors.status.error}10`, padding: spacing.md,
    borderRadius: borderRadius.lg, marginBottom: spacing.xl,
  },
  errorText: { color: colors.status.error, marginLeft: spacing.sm, flex: 1, ...typography.body2 },

  successContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: `${colors.status.success}10`, padding: spacing.md,
    borderRadius: borderRadius.lg, marginBottom: spacing.xl,
  },
  successText: { color: colors.status.success, marginLeft: spacing.sm, flex: 1, ...typography.body2 },

  retryContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: `${colors.primary.main}10`, padding: spacing.md,
    borderRadius: borderRadius.lg, marginBottom: spacing.md,
  },
  retryText: { color: colors.primary.main, marginLeft: spacing.sm, flex: 1, ...typography.body2 },

  attemptText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },

  inputContainer: { marginBottom: spacing.xl },
  label: { ...typography.body2, fontWeight: '500', color: colors.text.primary, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.lg,
    padding: spacing.md, ...typography.body1, color: colors.text.primary, backgroundColor: colors.background.default,
  },
  inputError: { borderColor: colors.status.error },

  resetButton: {
    backgroundColor: colors.primary.main, padding: spacing.md, borderRadius: borderRadius.lg,
    alignItems: 'center', marginBottom: spacing.xl, ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  resetButtonDisabled: { opacity: 0.7 },
  resetButtonText: { color: colors.background.default, ...typography.body1, fontWeight: '600' },

  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  retryButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },

  signInContainer: { alignItems: 'center' },
  signInText: { ...typography.body2, color: colors.text.secondary },
  signInLink: { color: colors.primary.main, fontWeight: '600' },
});
