// app/auth/reset-password.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { cardChromeLg, platformStyles } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';

const logoImg = require('../../assets/images/logo.png');

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checking, setChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requirements = useMemo(
    () => [
      { id: 'len', label: 'At least 8 characters', ok: (p: string) => p.length >= 8 },
      { id: 'num', label: 'Contains a number', ok: (p: string) => /\d/.test(p) },
      { id: 'spec', label: 'Contains a special character', ok: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
      { id: 'match', label: 'Passwords match', ok: (p: string) => p === confirmPassword && p.length > 0 },
    ],
    [confirmPassword]
  );

  // Deep-link handler. Supports both token_hash (recovery) and code (PKCE) flows.
  const handleIncomingUrl = useCallback(async (url?: string | null) => {
    console.log('📩 handleIncomingUrl called with:', url);
    if (!url) return;

    try {
      setChecking(true);

      const parsed = Linking.parse(url) as any;
      console.log('🔍 Parsed URL:', parsed);

      const qp = parsed?.queryParams ?? parsed?.params ?? {};
      console.log('📦 Query params:', qp);

      const type = (qp.type as string | undefined)?.toLowerCase();
      const token_hash = qp.token_hash as string | undefined;
      const code = qp.code as string | undefined;

      // Preferred (email recovery) shape: ?type=recovery&token_hash=...
      if (type === 'recovery' && token_hash) {
        console.log('✅ Using verifyOtp(recovery) with token_hash');
        const { data, error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash,
        });
        console.log('📤 verifyOtp result:', { data, error });
        if (error) throw error;
        setIsValidSession(!!data.session);
        setError(null);
        return;
      }

      // PKCE shape (some setups send ?code=...):
      if (code) {
        console.log('✅ Using exchangeCodeForSession(code)');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('📤 exchangeCodeForSession result:', { data, error });
        if (error) throw error;
        setIsValidSession(!!data.session);
        setError(null);
        return;
      }

      console.log('❌ No token_hash or code found; wrong link shape');
      throw new Error('Missing token_hash or code in URL');
    } catch (e) {
      console.error('❌ Deep link session error:', e);
      setIsValidSession(false);
      setError('Invalid or expired password reset link. Please request a new one.');
    } finally {
      setChecking(false);
      console.log('⏹ Finished handleIncomingUrl');
    }
  }, []);

  // Initial check + listeners
  useEffect(() => {
    console.log('🚀 ResetPasswordScreen mounted');
    (async () => {
      try {
        console.log('🔍 Checking existing session…');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📤 Existing session:', !!session);
        if (session) {
          setIsValidSession(true);
          setError(null);
          setChecking(false);
          return;
        }

        console.log('🔍 Getting initial deep link…');
        const initial = await Linking.getInitialURL();
        console.log('📤 Initial URL:', initial);
        if (initial) {
          await handleIncomingUrl(initial);
        } else {
          console.log('❌ No initial URL');
          setIsValidSession(false);
          setError('Invalid or expired password reset link. Please request a new one.');
          setChecking(false);
        }
      } catch (e) {
        console.error('❌ Initial session check error:', e);
        setIsValidSession(false);
        setError('Invalid or expired password reset link. Please request a new one.');
        setChecking(false);
      }
    })();

    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('🔔 URL event:', url);
      handleIncomingUrl(url);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt: any, session: any) => {
      console.log('🔔 Auth state changed:', evt, !!session);
      if (session) {
        setIsValidSession(true);
        setError(null);
      }
    });

    return () => {
      console.log('🛑 ResetPasswordScreen unmounted');
      sub.remove?.();
      subscription.unsubscribe();
    };
  }, [handleIncomingUrl]);

  const validate = () => {
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    const allOk = requirements.every((r) => r.ok(newPassword));
    if (!allOk) return 'Password does not meet all requirements';
    return null;
  };

  const handleUpdatePassword = async () => {
    try {
      setError(null);
      setSuccess(false);

      const v = validate();
      if (v) {
        setError(v);
        return;
      }

      setIsLoading(true);
      console.log('🔧 Calling supabase.auth.updateUser(password)');
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // Sign out for a clean login (optional—remove if you want to keep the session)
      setTimeout(async () => {
        console.log('🔒 Signing out after password change…');
        await supabase.auth.signOut();
        router.replace('/auth/sign-in' as any);
      }, 1200);
    } catch (e) {
      console.error('❌ Password update error:', e);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={screenChrome.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={screenChrome.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={screenChrome.container}
        overScrollMode="never"
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerPaddingTop, paddingBottom: scrollContentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.content}>
          <Animated.View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={styles.formContainer} entering={FadeInDown.delay(200)}>
            <Text style={styles.title}>Update Password</Text>
            <Text style={styles.subtitle}>Create a new password for your account.</Text>

            {error && (
              <View style={styles.bannerRowError}>
                <AlertCircle size={20} color={colors.status.error} />
                <Text style={styles.bannerTextError}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.bannerRowSuccess}>
                <Check size={20} color={colors.status.success} />
                <Text style={styles.bannerTextSuccess}>
                  Password updated! Redirecting to sign in…
                </Text>
              </View>
            )}

            {isValidSession && !success && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        setError(null);
                      }}
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.text.secondary}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword((v) => !v)}
                      accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} color={colors.text.secondary} />
                      ) : (
                        <Eye size={20} color={colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        setError(null);
                      }}
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.text.secondary}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={colors.text.secondary} />
                      ) : (
                        <Eye size={20} color={colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {newPassword.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Password Requirements</Text>
                    {requirements.map((r) => {
                      const ok = r.ok(newPassword);
                      return (
                        <View key={r.id} style={styles.requirementRow}>
                          {ok ? (
                            <Check size={16} color={colors.status.success} />
                          ) : (
                            <View style={styles.requirementDot} />
                          )}
                          <Text style={[styles.requirementText, ok && styles.requirementMet]}>
                            {r.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.updateButton, (isLoading || success) && styles.updateButtonDisabled]}
                  onPress={handleUpdatePassword}
                  disabled={isLoading || success}
                >
                  <Text style={styles.updateButtonText}>
                    {isLoading ? 'Updating…' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!success && (
              <TouchableOpacity
                style={styles.signInContainer}
                onPress={() => router.replace('/auth/sign-in' as any)}
              >
                <Text style={styles.signInText}>
                  Back to <Text style={styles.signInLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: spacing.lg },
  content: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body1, color: colors.text.secondary },

  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 160, height: 45 },

  formContainer: {
    width: '100%',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...cardChromeLg,
  },
  title: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { ...typography.body1, color: colors.text.secondary, marginBottom: spacing.xxl, lineHeight: 24 },

  bannerRowError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  bannerTextError: { color: colors.status.error, marginLeft: spacing.sm, flex: 1, ...typography.body2 },

  bannerRowSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.success}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  bannerTextSuccess: { color: colors.status.success, marginLeft: spacing.sm, flex: 1, ...typography.body2 },

  inputContainer: { marginBottom: spacing.lg },
  label: { ...typography.body2, fontWeight: '500', color: colors.text.primary, marginBottom: spacing.xs },

  passwordContainer: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  passwordInput: { flex: 1, padding: spacing.md, ...typography.body1, color: colors.text.primary },
  eyeButton: { padding: spacing.md },

  requirementsContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  requirementsTitle: { ...typography.body2, fontWeight: '500', color: colors.text.primary, marginBottom: spacing.sm },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  requirementDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.gray[300], marginRight: spacing.sm },
  requirementText: { ...typography.body2, color: colors.text.secondary, marginLeft: spacing.sm },
  requirementMet: { color: colors.status.success },

  updateButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  updateButtonDisabled: { opacity: 0.7 },
  updateButtonText: { color: colors.background.default, ...typography.body1, fontWeight: '600' },

  signInContainer: { alignItems: 'center', marginBottom: spacing.lg },
  signInText: { ...typography.body2, color: colors.text.secondary },
  signInLink: { color: colors.primary.main, fontWeight: '600' },
});

