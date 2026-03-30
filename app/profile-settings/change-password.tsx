import { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Key, AlertCircle, Eye, EyeOff, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { screenChrome } from '@/utils/screenChrome';
import { useResponsive } from '@/hooks/useResponsive';

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
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();
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
      style={screenChrome.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Change Password</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[screenChrome.scrollContent, styles.scrollPad, { paddingBottom: scrollContentPaddingBottom + responsiveSize.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" style={styles.introCard}>
              <View style={styles.introIconContainer}>
                <Key size={moderateScale(22)} color={colors.primary.main} />
              </View>
              <View style={styles.introContent}>
                <SmartText variant="h3" style={styles.introTitle}>Update Password</SmartText>
                <SmartText variant="body1" style={styles.introText}>
                  Choose a strong password that you haven't used before. A strong password helps protect your account.
                </SmartText>
              </View>
            </Card>
          </Animated.View>

          {error && (
            <Animated.View entering={FadeInUp}>
              <Card padding="md" variant="outlined" style={styles.errorContainer}>
                <AlertCircle size={moderateScale(18)} color={colors.status.error} style={{ marginRight: responsiveSize.xs }} />
                <SmartText variant="body2" style={styles.errorText}>{error}</SmartText>
              </Card>
            </Animated.View>
          )}

          {success && (
            <Animated.View entering={FadeInUp}>
              <Card padding="md" variant="outlined" style={styles.successContainer}>
                <Check size={moderateScale(18)} color={colors.status.success} style={{ marginRight: responsiveSize.xs }} />
                <SmartText variant="body2" style={styles.successText}>
                  Password updated successfully!
                </SmartText>
              </Card>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(300)}>
            <Card padding="lg" style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <SmartText variant="body2" style={styles.label}>Current Password</SmartText>
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
                      <EyeOff size={moderateScale(18)} color={colors.text.secondary} />
                    ) : (
                      <Eye size={moderateScale(18)} color={colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <SmartText variant="body2" style={styles.label}>New Password</SmartText>
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
                      <EyeOff size={moderateScale(18)} color={colors.text.secondary} />
                    ) : (
                      <Eye size={moderateScale(18)} color={colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <SmartText variant="body2" style={styles.label}>Confirm New Password</SmartText>
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
                      <EyeOff size={moderateScale(18)} color={colors.text.secondary} />
                    ) : (
                      <Eye size={moderateScale(18)} color={colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {newPassword && (
                <View style={styles.requirementsContainer}>
                  <SmartText variant="body2" style={styles.requirementsTitle}>Password Requirements</SmartText>
                  {passwordRequirements.map((req) => (
                    <View key={req.id} style={styles.requirementRow}>
                      {req.check(newPassword) ? (
                        <Check size={moderateScale(14)} color={colors.status.success} />
                      ) : (
                        <View style={styles.requirementDot} />
                      )}
                      <SmartText variant="body2" style={[
                        styles.requirementText,
                        req.check(newPassword) && styles.requirementMet
                      ]}>
                        {req.label}
                      </SmartText>
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
                <SmartText variant="body1" style={styles.updateButtonText}>
                  {isLoading ? 'Updating...' : 'Update Password'}
                </SmartText>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: responsiveSize.md,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.sm,
    marginBottom: responsiveSize.lg,
  },
  introIconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  introContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  introTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  introText: {
    color: colors.text.secondary,
  },

  errorContainer: {
    backgroundColor: rgbaFromHex(colors.status.error, 0.1),
    borderColor: rgbaFromHex(colors.status.error, 0.3),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.lg,
  },
  errorText: {
    flex: 1,
    color: colors.status.error,
  },

  successContainer: {
    backgroundColor: rgbaFromHex(colors.status.success, 0.1),
    borderColor: rgbaFromHex(colors.status.success, 0.3),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.lg,
  },
  successText: {
    flex: 1,
    color: colors.status.success,
  },

  formContainer: {
    marginBottom: responsiveSize.lg,
    gap: responsiveSize.md,
  },

  inputGroup: {
    gap: responsiveSize.xs,
  },
  label: {
    fontWeight: '500',
    color: colors.text.primary,
  },
  passwordContainer: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  passwordInput: {
    flex: 1,
    padding: responsiveSize.sm,
    fontSize: moderateScale(15),
    color: colors.text.primary,
  },
  eyeButton: {
    padding: responsiveSize.sm,
  },

  requirementsContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: responsiveSize.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    gap: responsiveSize.xs,
  },
  requirementsTitle: {
    fontWeight: '500',
    color: colors.text.primary,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
  },
  requirementDot: {
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: colors.gray[300],
    flexShrink: 0,
  },
  requirementText: {
    color: colors.text.secondary,
  },
  requirementMet: {
    color: colors.status.success,
  },

  updateButton: {
    backgroundColor: colors.primary.main,
    padding: responsiveSize.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    elevation: 0,
    ...(Platform.OS === 'ios' ? platformStyles.shadow : {}),
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: colors.background.default,
    fontWeight: '600',
  },
});
