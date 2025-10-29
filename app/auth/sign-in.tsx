// src/screens/SignInScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Keyboard,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);
const logoImg = require('../../assets/images/logo.png');

const MAX_ATTEMPTS = 6; // after first failure user will see "you have 5 more attempts"

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [emailRaw, setEmailRaw] = useState('');
  const email = useMemo(() => emailRaw.trim().toLowerCase(), [emailRaw]);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const [failedCount, setFailedCount] = useState(0);
  const showCapsHint = failedCount >= 2;

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Keyboard animations
  const contentOffset = useSharedValue(0);
  const logoScale = useSharedValue(1);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e: any) => {
      contentOffset.value = withSpring(-e.endCoordinates.height / 3);
      logoScale.value = withTiming(0.85);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      contentOffset.value = withSpring(0);
      logoScale.value = withTiming(1);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentOffset.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: interpolate(logoScale.value, [0.85, 1], [0.82, 1]),
  }));

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errs.email = 'Email is required';
    else if (!re.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  const normalizeSupabaseError = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes('email not confirmed')) {
      return 'Please check your email and confirm your account before signing in.';
    }
    if (lower.includes('too many requests')) {
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    }
    if (lower.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Sign-in error. Please try again or contact support if the problem persists.';
  };

  const ActivationMessage = ({ note }: { note?: string }) => (
    <View style={styles.errorContent}>
      <AlertCircle size={20} color={colors.status.error} />
      <Text style={styles.errorText}>
        {note ?? 'App login required. Please create your app login to continue.'}{' '}
        <Text
          style={styles.link}
          onPress={() => router.push({ pathname: '/auth/sign-up', params: { email } } as any)}
        >
          Create App Login
        </Text>
        {'  '}•{'  '}
        <Text style={styles.link} onPress={() => router.push('/auth/member-support')}>
          Contact Concierge
        </Text>
        .
      </Text>
    </View>
  );

  const handleSignIn = async () => {
    if (isLoading) return;
    setError(null);
    setFieldError({});
    if (!validate()) return;

    if (Platform.OS === 'android') {
      Keyboard.dismiss();
      await new Promise((r) => setTimeout(r, 100));
    }

    setIsLoading(true);
    // flags used across try/catch
    let inMembers = false;
    let inUsers = false;

    try {
      // --- Pre-checks: does email exist in members? users? ---
      const [membersQ, usersQ] = await Promise.all([
        supabase.from('members').select('email').eq('email', email).maybeSingle(),
        supabase.from('users').select('email').eq('email', email).maybeSingle(),
      ]);

      if (membersQ.error) console.warn('members lookup:', membersQ.error.message);
      if (usersQ.error) console.warn('users lookup:', usersQ.error.message);

      inMembers = !!membersQ.data;
      inUsers = !!usersQ.data;

      // 1) Email in MEMBERS but NOT in USERS -> must create app login
      if (inMembers && !inUsers) {
        setError(<ActivationMessage />);
        AccessibilityInfo.announceForAccessibility?.('App login required');
        return;
      }

      // 3) Email in NEITHER members nor users -> email likely wrong / not on file
      if (!inMembers && !inUsers) {
        setError(
          <View style={styles.errorContent}>
            <AlertCircle size={20} color={colors.status.error} />
            <Text style={styles.errorText}>
              Please double-check your email. If you have an active membership but can’t create your
              app login,{' '}
              <Text style={styles.link} onPress={() => router.push('/auth/member-support')}>
                contact our Concierge
              </Text>{' '}
              and we’ll help you get set up.
            </Text>
          </View>
        );
        AccessibilityInfo.announceForAccessibility?.('Email not found');
        return;
      }

      // Otherwise, try password sign-in
      await signIn({ email, password });

      // Optional post-auth policy (kept from your original code)
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('is_primary, dob, first_name, last_name')
          .eq('email', email)
          .maybeSingle();

        if (userData?.is_primary && userData?.dob) {
          const birthDate = new Date(userData.dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
          if (age > 65) {
            await supabase.auth.signOut();
            setFailedCount((c) => c + 1);
            setError(
              `Hello ${userData.first_name ?? ''} ${userData.last_name ?? ''}, you have aged out of your current plan. Please contact our Concierge team for assistance with alternative coverage options.`
            );
            return;
          }
        }
      } catch (e) {
        console.warn('Post-auth policy check failed (non-blocking).', e);
      }

      await new Promise((r) => setTimeout(r, 150));
      router.push('/(tabs)' as any);
    } catch (err: any) {
      // Tailored wrong-password message if the email is in USERS (case 2)
      const msg = (err?.message || '').toLowerCase();
      const invalidCreds =
        msg.includes('invalid login credentials') || msg.includes('invalid_credentials');

      setFailedCount((c) => {
        const next = c + 1;

        if (inUsers && invalidCreds) {
          const remaining = Math.max(0, MAX_ATTEMPTS - next);
          setError(
            <View style={styles.errorContent}>
              <AlertCircle size={20} color={colors.status.error} />
              <Text style={styles.errorText}>
                The password is incorrect. You have {remaining} more attempt{remaining === 1 ? '' : 's'}.
                {'  '}
                <Text style={styles.link} onPress={() => router.push('/auth/forgot-password')}>
                  Reset password
                </Text>
                .
              </Text>
            </View>
          );
        } else if (inMembers && !inUsers) {
          // Safety net: if signIn threw but user needs to create login, show that flow
          setError(<ActivationMessage />);
        } else {
          // Generic fallback
          setError(normalizeSupabaseError(err?.message || ''));
        }

        AccessibilityInfo.announceForAccessibility?.('Sign-in failed');
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AnimatedView style={[styles.content, contentStyle]}>
          <Animated.View style={[styles.logoContainer, logoStyle]} entering={FadeInDown.delay(100)}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
          </Animated.View>

          <AnimatedTouchableOpacity
            style={styles.formContainer}
            entering={FadeInDown.delay(180)}
            activeOpacity={1}
          >
            <Text style={styles.welcomeText}>
              Sign in to access your MPB Health dashboard
            </Text>

            {/* Errors / Notices */}
            {error && (
              <View style={styles.errorContainer}>
                {typeof error === 'string' ? (
                  <View style={styles.errorContent}>
                    <AlertCircle size={20} color={colors.status.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : (
                  error
                )}
                {showCapsHint && (
                  <Text style={styles.hintText}>
                    Having trouble? Check Caps Lock or try revealing your password.
                  </Text>
                )}
              </View>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
                style={[styles.input, fieldError.email ? styles.inputError : null]}
                value={emailRaw}
                onChangeText={(txt) => {
                  setEmailRaw(txt);
                  setFieldError((e) => ({ ...e, email: undefined }));
                  setError(null);
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholderTextColor={colors.text.secondary}
                accessibilityLabel="Email"
              />
              {!!fieldError.email && (
                <Text style={styles.fieldErrorText}>{fieldError.email}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  fieldError.password ? styles.inputError : null,
                ]}
              >
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(txt) => {
                    setPassword(txt);
                    setFieldError((e) => ({ ...e, password: undefined }));
                    setError(null);
                  }}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  placeholderTextColor={colors.text.secondary}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              {!!fieldError.password && (
                <Text style={styles.fieldErrorText}>{fieldError.password}</Text>
              )}
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Password sign-in */}
            <AnimatedTouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              entering={FadeInDown.delay(320)}
              layout={Layout.springify()}
              accessibilityRole="button"
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Text>
            </AnimatedTouchableOpacity>

            {/* Sign up / Create login */}
            <TouchableOpacity
              style={styles.signUpContainer}
              onPress={() => router.push('/auth/sign-up')}
            >
              <Text style={styles.signUpText}>
                New here? <Text style={styles.signUpLink}>Create App Login</Text>
              </Text>
            </TouchableOpacity>
          </AnimatedTouchableOpacity>
        </AnimatedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: { alignSelf: 'center', width: '100%', maxWidth: 400 },

  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { width: 180, height: 48, marginBottom: spacing.md },
  welcomeTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },

  formContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },

  welcomeText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },

  errorContainer: {
    backgroundColor: `${colors.status.error}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  errorContent: { flexDirection: 'row', alignItems: 'center' },
  errorText: { ...typography.body2, color: colors.status.error, marginLeft: spacing.sm, flex: 1 },
  hintText: { marginTop: spacing.xs, ...typography.caption, color: colors.text.secondary },

  link: { color: colors.primary.main, textDecorationLine: 'underline' },

  inputContainer: { marginBottom: spacing.lg },
  label: { ...typography.body2, fontWeight: '600' as const, color: colors.text.primary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  inputError: { borderColor: colors.status.error },
  fieldErrorText: { color: colors.status.error, ...typography.caption, marginTop: spacing.xs },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
  },
  passwordInput: { flex: 1, padding: spacing.md, ...typography.body1, color: colors.text.primary },
  eyeButton: { padding: spacing.md },

  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotPasswordText: { color: colors.primary.main, ...typography.body2, fontWeight: '500' },

  signInButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  signInButtonDisabled: { opacity: 0.7 },
  signInButtonText: { color: colors.background.default, ...typography.body1, fontWeight: '600' },

  signUpContainer: { alignItems: 'center' },
  signUpText: { ...typography.body2, color: colors.text.secondary },
  signUpLink: { color: colors.primary.main, fontWeight: '600' },
});
