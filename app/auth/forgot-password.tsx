// app/auth/forgot-password.tsx
import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image,
  ScrollView, KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Always use custom scheme so it opens the app directly
  const redirectTo = useMemo(
    () => 'mpbhealth://auth/reset-password?type=recovery',
    []
  );

  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!re.test(value)) return 'Please enter a valid email address';
    return null;
    };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(false);

    const e = validateEmail(email);
    if (e) { setError(e); return; }

    try {
      setIsLoading(true);
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo, // <- custom-scheme deep link
      });
      if (supaError) {
        setError(supaError.message || 'Failed to send password reset email.');
        return;
      }
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('resetPasswordForEmail error:', err);
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
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
              Enter your email address and we&apos;ll send you a link to reset your password in the app.
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
                  Check your email and tap the button to open MPB Health and finish resetting your password.
                </Text>
              </View>
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
              />
            </View>

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
  container: { flex: 1, backgroundColor: colors.background.default },
  scrollContent: { flexGrow: 1, padding: spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  content: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },

  header: { marginBottom: spacing.xxl },
  backButton: {
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100], justifyContent: 'center', alignItems: 'center', ...shadows.sm,
  },

  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 160, height: 45 },

  formContainer: {
    width: '100%', backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.lg,
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

  inputContainer: { marginBottom: spacing.xl },
  label: { ...typography.body2, fontWeight: '500', color: colors.text.primary, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.lg,
    padding: spacing.md, ...typography.body1, color: colors.text.primary, backgroundColor: colors.background.default,
  },
  inputError: { borderColor: colors.status.error },

  resetButton: {
    backgroundColor: colors.primary.main, padding: spacing.md, borderRadius: borderRadius.lg,
    alignItems: 'center', marginBottom: spacing.xl, ...shadows.md,
  },
  resetButtonDisabled: { opacity: 0.7 },
  resetButtonText: { color: colors.background.default, ...typography.body1, fontWeight: '600' },

  signInContainer: { alignItems: 'center' },
  signInText: { ...typography.body2, color: colors.text.secondary },
  signInLink: { color: colors.primary.main, fontWeight: '600' },
});
