import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { supabase } from '@/lib/supabase';
import { useUserData } from '@/hooks/useUserData';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Helper to convert HEX → RGBA
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
  const { userData } = useUserData();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showUpdateMembership, setShowUpdateMembership] = useState(false);

  // Check for success parameter from email confirmation
  useEffect(() => {
    const checkForSuccess = async () => {
      const url = await Linking.getInitialURL();
      if (url && url.includes('email-change-success=true')) {
        setSuccess(true);
      }
    };
    checkForSuccess();
  }, []);

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

      // Normalize new email to lowercase
      const normalizedNewEmail = newEmail.trim().toLowerCase();

      // Validate email
      const emailError = validateEmail(normalizedNewEmail);
      if (emailError) {
        setError(emailError);
        return;
      }

      // Validate password
      if (!password) {
        setError('Password is required to confirm this change');
        return;
      }

      setIsLoading(true);

      // Re-authenticate by signing in with current credentials (using normalized email)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (userData?.email || '').toLowerCase(),
        password,
      });

      if (signInError) {
        setError('Invalid password. Please try again.');
        return;
      }

      // Update email in auth with normalized email
      const { error: updateError } = await supabase.auth.updateUser({
        email: normalizedNewEmail,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Show email sent confirmation
      setEmailSent(true);
      setNewEmail('');
      setPassword('');
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
            <Text style={styles.headerTitle}>Update Membership</Text>
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
        <Text style={styles.title}>Change Email</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={styles.currentEmailCard} entering={FadeInUp.delay(200)}>
          <View style={styles.iconContainer}>
            <Mail size={24} color={colors.primary.main} />
          </View>
          <View>
            <Text style={styles.label}>Current Email</Text>
            <Text style={styles.currentEmail}>{userData?.email}</Text>
          </View>
        </Animated.View>

        <Animated.View style={styles.warningCard} entering={FadeInUp.delay(250)}>
          <AlertCircle size={24} color={colors.status.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Important Notice</Text>
            <Text style={styles.warningText}>
              Changing your email address here will only update it for this mobile app. Your email address in the member portal and other services will remain unchanged.
            </Text>
            <Text style={styles.warningSubtext}>
              To update your email across all services, please use one of the options below:
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={styles.navigationCard} entering={FadeInUp.delay(275)}>
          <Text style={styles.navigationTitle}>Update Email Everywhere</Text>

          <View style={styles.navigationButtons}>
            <AnimatedTouchableOpacity
              style={styles.navigationButton}
              onPress={() => setShowUpdateMembership(true)}
              entering={FadeInUp.delay(300)}
            >
              <View style={styles.navigationButtonContent}>
                <Text style={styles.navigationButtonTitle}>Update Membership</Text>
                <Text style={styles.navigationButtonSubtitle}>Change email across all services</Text>
              </View>
              <View style={styles.navigationChevron}>
                <AlertCircle size={18} color={colors.primary.main} />
              </View>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={styles.navigationButton}
              onPress={() => router.push('/(tabs)/chat')}
              entering={FadeInUp.delay(325)}
            >
              <View style={styles.navigationButtonContent}>
                <Text style={styles.navigationButtonTitle}>Contact Concierge</Text>
                <Text style={styles.navigationButtonSubtitle}>Get assistance with email changes</Text>
              </View>
              <View style={styles.navigationChevron}>
                <AlertCircle size={18} color={colors.secondary.main} />
              </View>
            </AnimatedTouchableOpacity>
          </View>
        </Animated.View>

        {error && (
          <Animated.View style={styles.errorContainer} entering={FadeInUp}>
            <AlertCircle size={20} color={colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {success && (
          <Animated.View style={styles.successContainer} entering={FadeInUp}>
            <AlertCircle size={20} color={colors.status.success} />
            <Text style={styles.successText}>
              Email address has been successfully updated! You can now sign in with your new email address.
            </Text>
          </Animated.View>
        )}

        {emailSent && !success ? (
          <Animated.View style={styles.emailSentContainer} entering={FadeInUp.delay(300)}>
            <Mail size={24} color={colors.primary.main} />
            <Text style={styles.emailSentTitle}>Check Your Email</Text>
            <Text style={styles.emailSentText}>
              We've sent a confirmation email to <Text style={styles.emailHighlight}>{newEmail}</Text>. Please click the link in the email to confirm your new email address.
            </Text>
            <Text style={styles.emailSentSubtext}>
              Don't see the email? Check your spam or junk folder.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={styles.formContainer} entering={FadeInUp.delay(350)}>
            <Text style={styles.formTitle}>Change App Email Only</Text>
            <Text style={styles.formSubtitle}>
              This will only change your email for this mobile app. To update your email everywhere, use the options above.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Email Address</Text>
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
              <Text style={styles.inputLabel}>Confirm with Password</Text>
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
                    <EyeOff size={20} color={colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                We need your current password to confirm this change
              </Text>
            </View>

            <AnimatedTouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleEmailChange}
              disabled={isLoading}
              entering={FadeInUp.delay(425)}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Updating App Email...' : 'Update App Email Only'}
              </Text>
            </AnimatedTouchableOpacity>
          </Animated.View>
        )}

        <Animated.View style={styles.infoCard} entering={FadeInUp.delay(450)}>
          <AlertCircle size={20} color={colors.status.info} />
          <Text style={styles.infoText}>
            After updating your app email, you'll receive a verification email at your new address. This change only affects your mobile app login.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... keep existing styles unchanged (same as you provided) ...
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
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  currentEmailCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  label: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  currentEmail: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
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
  formContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  formTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.status.error,
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
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.background.default,
    ...typography.body1,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: rgbaFromHex(colors.status.info, 0.08),
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.body2,
    color: colors.status.info,
    lineHeight: 20,
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
  emailSentContainer: {
    backgroundColor: `${colors.primary.main}08`,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emailSentTitle: {
    ...typography.h3,
    color: colors.primary.main,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emailSentText: {
    ...typography.body1,
    color: colors.primary.main,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  emailHighlight: {
    fontWeight: '600',
  },
  emailSentSubtext: {
    ...typography.body2,
    color: colors.primary.main,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  warningCard: {
    backgroundColor: rgbaFromHex(colors.status.warning, 0.08),
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  warningContent: {
    flex: 1,
    minWidth: 0,
  },
  warningTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.status.warning,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  warningText: {
    ...typography.body2,
    color: colors.status.warning,
    lineHeight: 20,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  warningSubtext: {
    ...typography.body2,
    color: colors.status.warning,
    lineHeight: 20,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  navigationCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  navigationTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  navigationButtons: {
    gap: spacing.md,
  },
  navigationButton: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70,
    ...shadows.sm,
  },
  navigationButtonContent: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  navigationButtonTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
    flexWrap: 'wrap',
  },
  navigationButtonSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  navigationChevron: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
