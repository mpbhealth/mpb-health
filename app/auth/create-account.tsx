// app/auth/create-account.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';

const formatDateForStorage = (dobString: string): string => {
  if (!dobString) return '';
  if (dobString.includes('-')) return dobString;
  if (dobString.length === 8) {
    const y = dobString.substring(0, 4);
    const m = dobString.substring(4, 6);
    const d = dobString.substring(6, 8);
    return `${y}-${m}-${d}`;
  }
  return dobString;
};

const parseBool = (val: any): boolean => {
  return String(val ?? '').trim().toLowerCase() === 'true';
};

const toNullableNumber = (val: any): number | null => {
  const s = String(val ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const friendlyAuthError = (err: any): string => {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'An account already exists for this email. Please sign in.';
  }
  if (msg.includes('password')) {
    return 'Password is invalid. It must be at least 8 characters.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please try again shortly.';
  }
  return err?.message || 'Something went wrong while creating your account.';
};

export default function CreateAccountScreen() {
  const router = useRouter();
  const {
    memberId,
    email: memberEmail,
    firstName,
    lastName,
    productId,
    productLabel,
    productBenefit,
    agentId,
    dob,
    isPrimary,
    relationship,
    primaryId,
    activeDate,
    inactiveDate,
    inactiveReason,
    isActive,
    createdDate,
  } = useLocalSearchParams();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Animations
  const contentOffset = useSharedValue(0);
  const formScale = useSharedValue(1);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        contentOffset.value = withSpring(-e.endCoordinates.height / 3);
        formScale.value = withTiming(0.95);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        contentOffset.value = withSpring(0);
        formScale.value = withTiming(1);
      }
    );
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentOffset.value }, { scale: formScale.value }],
  }));

  const validatePassword = (pass: string) => {
    if (!pass) return 'Password is required';
    if (pass.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleCreateAccount = async () => {
    try {
      setError(null);

      // Required routing params
      const emailValRaw = String(memberEmail ?? '').trim();
      if (!emailValRaw) {
        setError('Member email not found. Please contact support.');
        return;
      }
      // ✅ Normalize to lowercase for BOTH Auth and users table
      const emailVal = emailValRaw.toLowerCase();

      const memberIdVal = String(memberId ?? '').trim();
      if (!memberIdVal) {
        setError('Member ID not found. Please go back and verify again.');
        return;
      }

      const normalizedIsPrimary = parseBool(isPrimary);
      const relationshipVal =
        (relationship as string) && String(relationship).trim() !== ''
          ? String(relationship)
          : normalizedIsPrimary
            ? 'primary'
            : 'dependent';
      const primaryIdVal = String(primaryId ?? '').trim();
      if (!normalizedIsPrimary && !primaryIdVal) {
        setError('Missing primary ID for a dependent member. Please contact support.');
        return;
      }

      // Validate password
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);

      // ----- Final safety check: verify email is not already registered in auth -----
      const checkAuthUrl = `${supabase.supabaseUrl}/functions/v1/check-email-exists`;
      const authCheckRes = await fetch(checkAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({ email: emailVal }),
      });

      if (authCheckRes.ok) {
        const { exists: authExists } = await authCheckRes.json();
        if (authExists) {
          setError('An account already exists for this email. Please sign in instead.');
          return;
        }
      }

      // ----- Create auth account (Auth always stores lowercase; we send lowercase) -----
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: emailVal,
        password,
      });
      if (signUpError) {
        throw new Error(friendlyAuthError(signUpError));
      }
      if (!authData.user) {
        throw new Error('Failed to create user account.');
      }

      // ----- Insert into users table (store lowercase to keep in sync with Auth) -----
      const profilePayload = {
        id: authData.user.id,
        email: emailVal, // ✅ LOWERCASED
        member_id: memberIdVal,
        first_name: String(firstName ?? ''),
        last_name: String(lastName ?? ''),
        product_id: toNullableNumber(productId) ?? String(productId ?? ''), // handle both numeric/text schemas
        product_label: String(productLabel ?? ''),
        product_benefit: String(productBenefit ?? ''),
        agent_id: toNullableNumber(agentId) ?? String(agentId ?? ''),
        dob: formatDateForStorage(String(dob ?? '')),
        is_primary: normalizedIsPrimary,
        relationship: relationshipVal,
        primary_id: normalizedIsPrimary ? null : (toNullableNumber(primaryIdVal) ?? primaryIdVal),
        active_date: activeDate ? formatDateForStorage(String(activeDate)) : null,
        inactive_date: inactiveDate ? formatDateForStorage(String(inactiveDate)) : null,
        inactive_reason: inactiveReason ? String(inactiveReason) : null,
        is_active: isActive !== undefined && isActive !== null ? parseBool(isActive) : null,
        created_date: createdDate ? String(createdDate) : null,
      };

      // If your users.id is the PK = auth user id, insert is fine.
      // If you also enforce unique emails, consider using upsert with onConflict: 'id' or a unique lower(email) index.
      const { error: profileError } = await supabase.from('users').insert(profilePayload);
      if (profileError) {
        console.error('Profile insert error:', profileError);
        try { await supabase.auth.signOut(); } catch {}
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Data must exist only in users table: remove from members after successful insert
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('member_id', memberIdVal);
      if (deleteError) {
        console.error('Member delete error:', deleteError);
        throw new Error('Account created, but we could not complete cleanup. Please try again or contact support.');
      }

      // Success → go to sign-in
      router.replace('/auth/sign-in');
    } catch (err: any) {
      console.error('CreateAccount error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.container}
        overScrollMode="never"
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerPaddingTop, paddingBottom: scrollContentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, contentStyle]}>
          <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={styles.formContainer} entering={FadeInDown.delay(200)}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Set up your account credentials to access the app</Text>

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.emailDisplay}>
                {/* Show the email lowercased to set the user expectation */}
                <Text style={styles.emailText}>{String(memberEmail ?? '').trim().toLowerCase()}</Text>
              </View>
              <Text style={styles.helperText}>We’ll use this email for your login.</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password (minimum 8 characters)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={colors.text.secondary} /> : <Eye size={20} color={colors.text.secondary} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={20} color={colors.text.secondary} /> : <Eye size={20} color={colors.text.secondary} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, isLoading && styles.createButtonDisabled]}
              onPress={handleCreateAccount}
              disabled={isLoading}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signInContainer} onPress={() => router.push('/auth/sign-in')}>
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLink}>Sign In</Text>
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
  scrollContent: { flexGrow: 1, padding: spacing.lg },
  content: { flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { marginBottom: spacing.xxl },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  formContainer: {
    width: '100%',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  title: { ...typography.h2, fontWeight: '700' as const, color: colors.text.primary, marginBottom: spacing.xs, textAlign: 'center' as const },
  subtitle: { ...typography.body1, color: colors.text.secondary, marginBottom: spacing.xl, textAlign: 'center' as const, lineHeight: 24 },
  errorContainer: {
    backgroundColor: `${colors.status.error}10`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  errorText: { flex: 1, ...typography.body2, color: colors.status.error },
  inputContainer: { gap: spacing.xs, marginBottom: spacing.lg },
  label: { ...typography.body2, fontWeight: '600' as const, color: colors.text.primary },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  emailDisplay: { backgroundColor: colors.background.paper, borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.lg, padding: spacing.md },
  emailText: { ...typography.body1, color: colors.text.primary, fontWeight: '600' as const },
  helperText: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.xs },
  passwordContainer: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: { flex: 1, padding: spacing.md, ...typography.body1, color: colors.text.primary },
  eyeButton: { padding: spacing.md },
  createButton: {
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: colors.background.default, ...typography.body1, fontWeight: '700' as const },
  signInContainer: { alignItems: 'center' },
  signInText: { ...typography.body2, color: colors.text.secondary },
  signInLink: { color: colors.primary.main, fontWeight: '700' as const },
});
