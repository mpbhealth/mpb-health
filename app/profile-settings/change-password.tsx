import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Key, AlertCircle, Eye, EyeOff, Check } from 'lucide-react-native';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

// Helper to convert HEX → RGBA
function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', check: (pass: string) => pass.length >= 8 },
    { id: 'match', label: 'Passwords match', check: (pass: string) => pass === confirmPassword && pass !== '' },
  ];

  const validatePassword = () => {
    if (!currentPassword) return 'Current password is required';
    if (!newPassword) return 'New password is required';
    if (!confirmPassword) return 'Please confirm your new password';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    if (currentPassword === newPassword) return 'New password must be different from current password';
    return null;
  };

  const handlePasswordChange = async () => {
    try {
      setError(null);
      setSuccess(false);

      const validationError = validatePassword();
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsLoading(true);

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Navigate back after success
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Change Password</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={styles.introCard}
          entering={FadeInUp.delay(200)}
        >
          <View style={styles.introIconContainer}>
            <Key size={24} color={colors.primary.main} />
          </View>
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Update Password</Text>
            <Text style={styles.introText}>
              Choose a strong password that you haven't used before. A strong password helps protect your account.
            </Text>
          </View>
        </Animated.View>

        {error && (
          <Animated.View
            style={styles.errorContainer}
            entering={FadeInUp}
          >
            <AlertCircle size={20} color={colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {success && (
          <Animated.View
            style={styles.successContainer}
            entering={FadeInUp}
          >
            <Check size={20} color={colors.status.success} />
            <Text style={styles.successText}>
              Password updated successfully!
            </Text>
          </Animated.View>
        )}

        <Animated.View 
          style={styles.formContainer}
          entering={FadeInUp.delay(300)}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setError(null);
                }}
                placeholder="Enter current password"
                placeholderTextColor={colors.text.secondary}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                editable={!success}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color={colors.text.secondary} />
                ) : (
                  <Eye size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
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
                placeholderTextColor={colors.text.secondary}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!success}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={colors.text.secondary} />
                ) : (
                  <Eye size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
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
                placeholderTextColor={colors.text.secondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!success}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  <Text style={[
                    styles.requirementText,
                    req.check(newPassword) && styles.requirementMet
                  ]}>
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.updateButton,
              (isLoading || success) && styles.updateButtonDisabled
            ]}
            onPress={handlePasswordChange}
            disabled={isLoading || success}
          >
            <Text style={styles.updateButtonText}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    backgroundColor: colors.background.default,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row', 
    alignItems: 'flex-start',
    gap: spacing.md,
    ...shadows.md,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  introText: {
    ...typography.body1,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: rgbaFromHex(colors.status.error, 0.1),
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    ...typography.body2,
    color: colors.status.error,
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: rgbaFromHex(colors.status.success, 0.1),
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  successText: {
    flex: 1,
    ...typography.body2,
    color: colors.status.success,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  passwordContainer: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...shadows.sm,
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
    ...shadows.md,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: colors.background.default,
    ...typography.body1,
    fontWeight: '600',
  },
});