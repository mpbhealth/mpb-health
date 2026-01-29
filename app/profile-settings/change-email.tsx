import { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { useUserData } from '@/hooks/useUserData';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const { userData } = useUserData();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showUpdateMembership, setShowUpdateMembership] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'New email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (email === userData?.email) return 'New email must be different from current email';
    return null;
  };

  const handleEmailChange = async () => {
    try {
      setError(null);

      const normalizedNewEmail = newEmail.trim().toLowerCase();

      const emailError = validateEmail(normalizedNewEmail);
      if (emailError) {
        setError(emailError);
        return;
      }

      if (!password) {
        setError('Password is required to confirm this change');
        return;
      }

      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please sign in again.');
        return;
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/update-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          newEmail: normalizedNewEmail,
          currentPassword: password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update email');
        return;
      }

      setSuccess(true);
      setNewEmail('');
      setPassword('');

      await supabase.auth.refreshSession();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (showUpdateMembership) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => setShowUpdateMembership(false)} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Update Membership</SmartText>
          </View>
        </View>
        <WebViewContainer url="https://www.cognitoforms.com/MPoweringBenefits1/MemberUpdates" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Change Email</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" style={styles.currentEmailCard}>
              <View style={styles.iconContainer}>
                <Mail size={moderateScale(22)} color={colors.primary.main} />
              </View>
              <View style={styles.emailContent}>
                <SmartText variant="body2" style={styles.label}>Current Email</SmartText>
                <SmartText variant="body1" style={styles.currentEmail}>{userData?.email}</SmartText>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250)}>
            <Card padding="md" variant="outlined" style={styles.warningCard}>
              <AlertCircle size={moderateScale(22)} color={colors.status.warning} style={{ marginRight: responsiveSize.sm }} />
              <View style={styles.warningContent}>
                <SmartText variant="body1" style={styles.warningTitle}>Important Notice</SmartText>
                <SmartText variant="body2" style={styles.warningText}>
                  Changing your email address here will only update your app login credentials.
                </SmartText>
                <SmartText variant="body2" style={styles.warningSubtext}>
                  To update your email across all providers and services, use one of the options below:
                </SmartText>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(275)}>
            <Card padding="lg" style={styles.navigationCard}>
              <SmartText variant="h3" style={styles.navigationTitle}>Update Email Everywhere</SmartText>

              <View style={styles.navigationButtons}>
                <AnimatedTouchableOpacity
                  style={styles.navigationButton}
                  onPress={() => setShowUpdateMembership(true)}
                  entering={FadeInUp.delay(300)}
                >
                  <View style={styles.navigationButtonContent}>
                    <SmartText variant="body1" style={styles.navigationButtonTitle}>Update Membership</SmartText>
                    <SmartText variant="body2" style={styles.navigationButtonSubtitle}>Change email across all services</SmartText>
                  </View>
                  <View style={styles.navigationChevron}>
                    <AlertCircle size={moderateScale(16)} color={colors.primary.main} />
                  </View>
                </AnimatedTouchableOpacity>

                <AnimatedTouchableOpacity
                  style={styles.navigationButton}
                  onPress={() => router.push('/(tabs)/chat')}
                  entering={FadeInUp.delay(325)}
                >
                  <View style={styles.navigationButtonContent}>
                    <SmartText variant="body1" style={styles.navigationButtonTitle}>Contact Concierge</SmartText>
                    <SmartText variant="body2" style={styles.navigationButtonSubtitle}>Get assistance with email changes</SmartText>
                  </View>
                  <View style={styles.navigationChevron}>
                    <AlertCircle size={moderateScale(16)} color={colors.secondary.main} />
                  </View>
                </AnimatedTouchableOpacity>
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

          {success ? (
            <Animated.View entering={FadeInUp}>
              <Card padding="lg" style={styles.successContainer}>
                <Mail size={moderateScale(24)} color={colors.status.success} />
                <SmartText variant="h3" style={styles.successTitle}>Email Updated!</SmartText>
                <SmartText variant="body1" style={styles.successText}>
                  Your email address has been successfully updated for app login. You can now sign in with your new email address.
                </SmartText>
                <Card padding="md" variant="outlined" style={styles.successInfoCard}>
                  <AlertCircle size={moderateScale(18)} color={colors.status.info} style={{ marginRight: responsiveSize.xs }} />
                  <View style={styles.successInfoContent}>
                    <SmartText variant="body2" style={styles.successInfoText}>
                      This change only affects your app login. To update your email across all providers and services, please submit an email change request using the options above.
                    </SmartText>
                  </View>
                </Card>
              </Card>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(350)}>
              <Card padding="lg" style={styles.formContainer}>
                <SmartText variant="h3" style={styles.formTitle}>Change App Login Email</SmartText>
                <SmartText variant="body1" style={styles.formSubtitle}>
                  This will instantly update your email for app login only.
                </SmartText>

                <View style={styles.inputGroup}>
                  <SmartText variant="body2" style={styles.inputLabel}>New Email Address</SmartText>
                  <TextInput
                    style={[styles.input, error ? styles.inputError : null]}
                    value={newEmail}
                    onChangeText={(text) => {
                      setNewEmail(text);
                      setError(null);
                    }}
                    placeholder="Enter new email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <SmartText variant="body2" style={styles.inputLabel}>Confirm with Password</SmartText>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError(null);
                      }}
                      placeholder="Enter your current password"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      placeholderTextColor={colors.text.secondary}
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={moderateScale(18)} color={colors.text.secondary} />
                      ) : (
                        <Eye size={moderateScale(18)} color={colors.text.secondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                  <SmartText variant="caption" style={styles.helperText}>
                    We need your current password to confirm this change
                  </SmartText>
                </View>

                <AnimatedTouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleEmailChange}
                  disabled={isLoading}
                  entering={FadeInUp.delay(425)}
                >
                  <SmartText variant="body1" style={styles.submitButtonText}>
                    {isLoading ? 'Updating Email...' : 'Update Email Now'}
                  </SmartText>
                </AnimatedTouchableOpacity>
              </Card>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(450)}>
            <Card padding="md" variant="outlined" style={styles.infoCard}>
              <AlertCircle size={moderateScale(18)} color={colors.status.info} style={{ marginRight: responsiveSize.xs }} />
              <SmartText variant="body2" style={styles.infoText}>
                This will update your login credentials for this app only. No email confirmation required.
              </SmartText>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    backgroundColor: colors.background.default,
    padding: responsiveSize.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...platformStyles.shadowSm,
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
  },
  headerContent: {
    flex: 1,
    marginLeft: responsiveSize.xs,
  },
  headerTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSize.md,
    paddingBottom: responsiveSize.xl,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  currentEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    marginBottom: responsiveSize.lg,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.full,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  emailContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  label: {
    color: colors.text.secondary,
  },
  currentEmail: {
    fontWeight: '600',
    color: colors.text.primary,
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
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
    gap: responsiveSize.sm,
  },
  successTitle: {
    color: colors.status.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  successText: {
    color: colors.status.success,
    textAlign: 'center',
  },
  successInfoCard: {
    backgroundColor: rgbaFromHex(colors.status.info, 0.08),
    borderColor: rgbaFromHex(colors.status.info, 0.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: responsiveSize.md,
  },
  successInfoContent: {
    flex: 1,
    minWidth: 0,
  },
  successInfoText: {
    color: colors.status.info,
  },

  formContainer: {
    marginBottom: responsiveSize.lg,
    gap: responsiveSize.md,
  },
  formTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  formSubtitle: {
    color: colors.text.secondary,
  },

  inputGroup: {
    gap: responsiveSize.xs,
  },
  inputLabel: {
    fontWeight: '500',
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: responsiveSize.sm,
    fontSize: moderateScale(15),
    color: colors.text.primary,
    minHeight: MIN_TOUCH_TARGET,
  },
  inputError: {
    borderColor: colors.status.error,
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
  helperText: {
    color: colors.text.secondary,
  },

  submitButton: {
    backgroundColor: colors.primary.main,
    padding: responsiveSize.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadow,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.background.default,
    fontWeight: '600',
  },

  infoCard: {
    backgroundColor: rgbaFromHex(colors.status.info, 0.08),
    borderColor: rgbaFromHex(colors.status.info, 0.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: colors.status.info,
  },

  warningCard: {
    backgroundColor: rgbaFromHex(colors.status.warning, 0.08),
    borderColor: rgbaFromHex(colors.status.warning, 0.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.lg,
  },
  warningContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs,
  },
  warningTitle: {
    fontWeight: '600',
    color: colors.status.warning,
  },
  warningText: {
    color: colors.status.warning,
  },
  warningSubtext: {
    color: colors.status.warning,
    fontWeight: '500',
  },

  navigationCard: {
    marginBottom: responsiveSize.lg,
    gap: responsiveSize.md,
  },
  navigationTitle: {
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  navigationButtons: {
    gap: responsiveSize.sm,
  },
  navigationButton: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },
  navigationButtonContent: {
    flex: 1,
    minWidth: 0,
    marginRight: responsiveSize.xs,
    gap: responsiveSize.xs / 4,
  },
  navigationButtonTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  navigationButtonSubtitle: {
    color: colors.text.secondary,
  },
  navigationChevron: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: borderRadius.md,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
