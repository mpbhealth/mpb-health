// src/screens/SignInScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
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
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);
const logoImg = require('../../assets/images/logo.png');

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
      <AlertCircle size={moderateScale(18)} color={colors.status.error} />
      <SmartText variant="body2" style={styles.errorText}>
        {note ?? 'App login required. Please create your app login to continue.'}{' '}
        <SmartText
          variant="body2"
          style={styles.link}
          onPress={() => router.push({ pathname: '/auth/sign-up', params: { email } } as any)}
        >
          Create App Login
        </SmartText>
        {'  '}•{'  '}
        <SmartText variant="body2" style={styles.link} onPress={() => router.push('/auth/member-support')}>
          Contact Concierge
        </SmartText>
        .
      </SmartText>
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

    try {
      // Check if email exists in members table
      const { data: memberData } = await supabase
        .from('members')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      // Check if email exists in users table (app login created)
      const { data: userData } = await supabase
        .from('users')
        .select('email, inactive_date, active_date')
        .eq('email', email)
        .maybeSingle();

      // Scenario 1: Member exists but no app login created
      if (memberData && !userData) {
        setError(
          <View style={styles.errorContent}>
            <AlertCircle size={moderateScale(18)} color={colors.status.error} />
            <SmartText variant="body2" style={styles.errorText}>
              You're an MPB Health member, but you haven't created your app login yet.{' '}
              <SmartText
                variant="body2"
                style={styles.link}
                onPress={() => router.push({ pathname: '/auth/sign-up', params: { email } } as any)}
              >
                Create App Login
              </SmartText>
              {' '}to access your dashboard. Need help?{' '}
              <SmartText variant="body2" style={styles.link} onPress={() => router.push('/auth/member-support')}>
                Contact Concierge
              </SmartText>
            </SmartText>
          </View>
        );
        AccessibilityInfo.announceForAccessibility?.('App login required');
        return;
      }

      // Scenario 2: Email doesn't exist in either table
      if (!memberData && !userData) {
        setError(
          <View style={styles.errorContent}>
            <AlertCircle size={moderateScale(18)} color={colors.status.error} />
            <SmartText variant="body2" style={styles.errorText}>
              We couldn't find this email in our system. Please double-check your email or{' '}
              <SmartText variant="body2" style={styles.link} onPress={() => router.push('/auth/member-support')}>
                contact our Concierge
              </SmartText>
              {' '}if you need assistance with your membership.
            </SmartText>
          </View>
        );
        AccessibilityInfo.announceForAccessibility?.('Email not found');
        return;
      }

      // Scenario 3: Check if member is inactive
      if (userData?.inactive_date) {
        const inactiveDate = new Date(userData.inactive_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        inactiveDate.setHours(0, 0, 0, 0);

        if (inactiveDate <= today) {
          setError(
            <View style={styles.errorContent}>
              <AlertCircle size={moderateScale(18)} color={colors.status.error} />
              <SmartText variant="body2" style={styles.errorText}>
                We miss you! Your membership is currently inactive. We'd love to have you back!{' '}
                <SmartText variant="body2" style={styles.link} onPress={() => router.push('/auth/member-support')}>
                  Contact our Concierge
                </SmartText>
                {' '}to reactivate your account and continue your health journey with us.
              </SmartText>
            </View>
          );
          AccessibilityInfo.announceForAccessibility?.('Membership inactive');
          return;
        }
      }

      // Scenario 4: App login exists, attempt sign-in
      await signIn({ email, password });

      await new Promise((r) => setTimeout(r, 150));
      router.push('/(tabs)' as any);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      const invalidCreds =
        msg.includes('invalid login credentials') || msg.includes('invalid_credentials');

      setFailedCount((c) => c + 1);

      // Scenario 5: Correct email but wrong password
      if (invalidCreds) {
        setError(
          <View style={styles.errorContent}>
            <AlertCircle size={moderateScale(18)} color={colors.status.error} />
            <SmartText variant="body2" style={styles.errorText}>
              The password you entered is incorrect.{' '}
              <SmartText variant="body2" style={styles.link} onPress={() => router.push('/auth/forgot-password')}>
                Reset password
              </SmartText>
              {' '}or try again.
            </SmartText>
          </View>
        );
      } else {
        // Scenario 6: Other errors (network, rate limit, etc.)
        setError(normalizeSupabaseError(err?.message || ''));
      }

      AccessibilityInfo.announceForAccessibility?.('Sign-in failed');
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
            <SmartText variant="h2" style={styles.welcomeTitle}>Welcome Back</SmartText>
          </Animated.View>

          <AnimatedTouchableOpacity
            style={styles.formContainer}
            entering={FadeInDown.delay(180)}
            activeOpacity={1}
          >
            <SmartText variant="body1" style={styles.welcomeText}>
              Sign in to access your MPB Health dashboard
            </SmartText>

            {/* Errors / Notices */}
            {error && (
              <View style={styles.errorContainer}>
                {typeof error === 'string' ? (
                  <View style={styles.errorContent}>
                    <AlertCircle size={moderateScale(18)} color={colors.status.error} />
                    <SmartText variant="body2" style={styles.errorText}>{error}</SmartText>
                  </View>
                ) : (
                  error
                )}
                {showCapsHint && (
                  <SmartText variant="caption" style={styles.hintText}>
                    Having trouble? Check Caps Lock or try revealing your password.
                  </SmartText>
                )}
              </View>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <SmartText variant="body2" style={styles.label}>Email</SmartText>
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
                <SmartText variant="caption" style={styles.fieldErrorText}>{fieldError.email}</SmartText>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <SmartText variant="body2" style={styles.label}>Password</SmartText>
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
                    <EyeOff size={moderateScale(18)} color={colors.text.secondary} />
                  ) : (
                    <Eye size={moderateScale(18)} color={colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              {!!fieldError.password && (
                <SmartText variant="caption" style={styles.fieldErrorText}>{fieldError.password}</SmartText>
              )}
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotPasswordButton}
            >
              <SmartText variant="body2" style={styles.forgotPasswordText}>Forgot password?</SmartText>
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
              <SmartText variant="body1" style={styles.signInButtonText}>
                {isLoading ? 'Signing in…' : 'Sign In'}
              </SmartText>
            </AnimatedTouchableOpacity>

            {/* Sign up / Create login */}
            <TouchableOpacity
              style={styles.signUpContainer}
              onPress={() => router.push('/auth/sign-up')}
            >
              <SmartText variant="body2" style={styles.signUpText}>
                New here? <SmartText variant="body2" style={styles.signUpLink}>Create App Login</SmartText>
              </SmartText>
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
    padding: responsiveSize.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: { alignSelf: 'center', width: '100%', maxWidth: 400 },

  logoContainer: { alignItems: 'center', marginBottom: responsiveSize.xl },
  logo: { width: moderateScale(160), height: moderateScale(42), marginBottom: responsiveSize.sm },
  welcomeTitle: {
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },

  formContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.lg,
    ...platformStyles.shadow,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },

  welcomeText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: responsiveSize.lg,
  },

  errorContainer: {
    backgroundColor: `${colors.status.error}10`,
    padding: responsiveSize.sm,
    borderRadius: borderRadius.md,
    marginBottom: responsiveSize.md,
    overflow: 'hidden',
  },
  errorContent: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', gap: responsiveSize.xs },
  errorText: { color: colors.status.error, flex: 1 },
  hintText: { marginTop: responsiveSize.xs, color: colors.text.secondary },

  link: { color: colors.primary.main, textDecorationLine: 'underline' },

  inputContainer: { marginBottom: responsiveSize.md },
  label: { fontWeight: '600', color: colors.text.primary, marginBottom: responsiveSize.xs },
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: responsiveSize.sm,
    fontSize: moderateScale(15),
    color: colors.text.primary,
  },
  inputError: { borderColor: colors.status.error },
  fieldErrorText: { color: colors.status.error, marginTop: responsiveSize.xs },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
  },
  passwordInput: { flex: 1, padding: responsiveSize.sm, fontSize: moderateScale(15), color: colors.text.primary },
  eyeButton: { padding: responsiveSize.sm },

  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: responsiveSize.md },
  forgotPasswordText: { color: colors.primary.main, fontWeight: '500' },

  signInButton: {
    backgroundColor: colors.primary.main,
    padding: responsiveSize.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: responsiveSize.xs,
    ...platformStyles.shadow,
  },
  signInButtonDisabled: { opacity: 0.7 },
  signInButtonText: { color: colors.background.default, fontWeight: '600' },

  signUpContainer: { alignItems: 'center' },
  signUpText: { color: colors.text.secondary },
  signUpLink: { color: colors.primary.main, fontWeight: '600' },
});
