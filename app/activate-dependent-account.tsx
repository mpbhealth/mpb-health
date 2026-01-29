import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

export default function ActivateDependentAccountScreen() {
  const router = useRouter();
  const {
    memberId,
    firstName,
    lastName,
    relationship,
    productId,
    productLabel,
    productBenefit,
    agentId,
    dob,
    primaryId,
    activeDate,
    inactiveDate,
    inactiveReason,
    isActive,
    createdDate,
  } = useLocalSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleActivateAccount = async () => {
    try {
      setError(null);

      // Validate email
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }

      // Validate password
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Check if email matches primary member's email
      if (primaryId) {
        const { data: primaryUser } = await supabase
          .from('users')
          .select('email')
          .eq('member_id', primaryId as string)
          .maybeSingle();

        if (primaryUser && primaryUser.email?.toLowerCase() === email.toLowerCase()) {
          setError('Dependent cannot use the same email as the primary member. Please use a different email address.');
          return;
        }
      }

      // Check if email is already in use
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        setError('This email is already in use. Please choose a different email.');
        return;
      }

      setIsLoading(true);

      // Create auth account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || 'Failed to create user account');
      }

      // Move data from members table to users table
      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        member_id: memberId as string,
        first_name: firstName as string,
        last_name: lastName as string,
        product_id: productId as string,
        product_label: productLabel as string,
        product_benefit: productBenefit as string,
        agent_id: agentId as string,
        dob: dob as string,
        relationship: relationship as string,
        is_primary: false,
        primary_id: primaryId as string,
        active_date: activeDate ? (activeDate as string) : null,
        inactive_date: inactiveDate ? (inactiveDate as string) : null,
        inactive_reason: inactiveReason ? (inactiveReason as string) : null,
        is_active: isActive !== undefined && isActive !== null && String(isActive).trim() !== ''
          ? String(isActive).toLowerCase() === 'true'
          : null,
        created_date: createdDate ? (createdDate as string) : null,
      });

      if (insertError) {
        // If user creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to create user profile');
      }

      // Delete the member record from members table
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('member_id', memberId as string);

      if (deleteError) {
        console.error('Failed to delete member record:', deleteError);
        // Don't throw here as the login was successfully created
      }

      // Show success message
      Alert.alert(
        'App Login Created!',
        `${firstName} ${lastName}'s app login has been successfully created. They can now sign in to the app using the email and password you provided.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/activate-dependents'),
          },
        ]
      );
    } catch (err) {
      console.error('Error creating app login for dependent:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.content}>
          <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
            <BackButton onPress={() => router.back()} />
          </Animated.View>

          <Animated.View style={styles.formContainer} entering={FadeInDown.delay(200)}>
            <View style={styles.dependentInfo}>
              <View style={styles.dependentIcon}>
                <User size={32} color={colors.primary.main} />
              </View>
              <Text style={styles.dependentName}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.dependentRelationship}>{relationship}</Text>
            </View>

            <Text style={styles.title}>Create App Login</Text>
            <Text style={styles.subtitle}>
              Set up email and password for this dependent to access their health portal through the app. Their membership is already active.
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor={colors.text.secondary}
              />
              <Text style={styles.helperText}>
                This will be their login email for the app
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  placeholder="Create a password (minimum 8 characters)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError(null);
                  }}
                  placeholder="Confirm the password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colors.text.secondary}
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

            <TouchableOpacity
              style={[styles.activateButton, isLoading && styles.activateButtonDisabled]}
              onPress={handleActivateAccount}
              disabled={isLoading}
            >
              <Text style={styles.activateButtonText}>
                {isLoading ? 'Creating Login...' : 'Create App Login'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <AlertCircle size={20} color={colors.status.info} />
              <Text style={styles.infoText}>
                Once the login is created, {firstName} will be able to sign in to the app using the email and password you set here.
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  formContainer: {
    width: '100%',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  dependentInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dependentIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary.main}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dependentName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  dependentRelationship: {
    ...typography.body1,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: `${colors.status.error}10`,
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
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  activateButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  activateButtonDisabled: {
    opacity: 0.7,
  },
  activateButtonText: {
    color: colors.background.default,
    ...typography.body1,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: `${colors.status.info}08`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
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
});