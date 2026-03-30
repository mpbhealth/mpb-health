// src/screens/UpdatePasswordScreen.tsx

import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { cardChromeLg, platformStyles } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';

const logoImg = require('../../assets/images/logo.png');

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        setError('Invalid or expired password reset link. Please request a new password reset.');
      }
    };

    checkSession();
  }, []);

  const validatePassword = (password: string) => {
    if (!password) return 'New password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', check: (pass: string) => pass.length >= 8 },
    { id: 'number', label: 'Contains a number', check: (pass: string) => /\d/.test(pass) },
    {
      id: 'special',
      label: 'Contains a special character',
      check: (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    },
    {
      id: 'match',
      label: 'Passwords match',
      check: (pass: string) => pass === confirmPassword && pass !== '',
    },
  ];

  const handleUpdatePassword = async () => {
    try {
      setError(null);
      setSuccess(false);

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (!passwordRequirements.every((req) => req.check(newPassword))) {
        setError('Password does not meet all requirements');
        return;
      }

      setIsLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.replace('/auth/sign-in');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession && !error) {
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
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.successContainer}>
                <Check size={20} color={colors.status.success} />
                <Text style={styles.successText}>
                  Password has been updated successfully! Redirecting to sign in...
                </Text>
              </View>
            )}

            {isValidSession && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        setError(null);
                      }}
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.text.secondary}
                      editable={!success}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
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
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError(null);
                      }}
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.text.secondary}
                      editable={!success}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      accessibilityLabel={
                        showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color={colors.text.secondary} />
                      ) : (
                        <Eye size={20} color={colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {newPassword && (
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Password Requirements</Text>
                    {passwordRequirements.map((req) => (
                      <View key={req.id} style={styles.requirementRow}>
                        {req.check(newPassword) ? (
                          <Check size={16} color={colors.status.success} />
                        ) : (
                          <View style={styles.requirementDot} />
                        )}
                        <Text
                          style={[
                            styles.requirementText,
                            req.check(newPassword) && styles.requirementMet,
                          ]}
                        >
                          {req.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.updateButton, (isLoading || success) && styles.updateButtonDisabled]}
                  onPress={handleUpdatePassword}
                  disabled={isLoading || success}
                >
                  <Text style={styles.updateButtonText}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.signInContainer} onPress={() => router.push('/auth/sign-in')}>
              <Text style={styles.signInText}>
                Back to <Text style={styles.signInLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 160,
    height: 45,
  },
  formContainer: {
    width: '100%',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...cardChromeLg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.status.error,
    marginLeft: spacing.sm,
    flex: 1,
    ...typography.body2,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.success}10`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  successText: {
    color: colors.status.success,
    marginLeft: spacing.sm,
    flex: 1,
    ...typography.body2,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  passwordContainer: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  eyeButton: {
    padding: spacing.md,
  },
  requirementsContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  requirementsTitle: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray[300],
    marginRight: spacing.sm,
  },
  requirementText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  requirementMet: {
    color: colors.status.success,
  },
  updateButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: colors.background.default,
    ...typography.body1,
    fontWeight: '600',
  },
  signInContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  signInText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  signInLink: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});
