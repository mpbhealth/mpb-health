// app/auth/verify-membership.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, User, Mail, Calendar } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

type VerificationMethod = 'memberId' | 'emailDob';

type MemberRow = {
  member_id: string;
  first_name: string | null;
  last_name: string | null;
  product_id: string | number | null;
  product_label: string | null;
  product_benefit: string | null;
  agent_id: string | number | null;
  dob: string | null; // "YYYY-MM-DD" or "YYYYMMDD"
  email: string | null;
  is_primary: boolean | null;
  relationship: string | null;
  primary_id: string | number | null;
};

// ---------- utilities ----------
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
const onlyDigits = (s: string) => s.replace(/\D/g, '');
const formatAsMMDDYYYY = (raw: string) => {
  const m = raw.slice(0, 2);
  const d = raw.slice(2, 4);
  const y = raw.slice(4, 8);
  if (raw.length <= 2) return m;
  if (raw.length <= 4) return `${m}/${d}`;
  return `${m}/${d}/${y}`;
};
const tryParseMMDDYYYY = (text: string): Date | null => {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const mm = Number(match[1]);
  const dd = Number(match[2]);
  const yyyy = Number(match[3]);
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  if (date > new Date()) return null;
  return date;
};
const formatDateToYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const safeLower = (s: string) => String(s ?? '').trim().toLowerCase();

// ---------- screen ----------
export default function VerifyMembershipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // UI state
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('memberId');
  const [memberId, setMemberId] = useState('');
  const [email, setEmail] = useState('');
  const emailLower = useMemo(() => safeLower(email), [email]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateInputText, setDateInputText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // dependent email capture
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [dependentMember, setDependentMember] = useState<MemberRow | null>(null);
  const [dependentEmail, setDependentEmail] = useState('');
  const dependentEmailLower = useMemo(() => safeLower(dependentEmail), [dependentEmail]);

  // attempt limiting with countdown
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 5 * 60 * 1000; // 5 minutes
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const locked = lockUntil !== null && now < lockUntil;
  const secondsLeft = locked ? Math.max(0, Math.ceil((lockUntil! - now) / 1000)) : 0;

  // ---------- validation ----------
  const validateMemberId = (id: string) => {
    if (!id.trim()) return 'Member ID is required';
    if (id.trim().length < 6) return 'Member ID must be at least 6 characters';
    return '';
  };
  const validateEmailDob = (emailVal: string, date: Date | null) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) return 'Email is required';
    if (!emailRegex.test(emailVal)) return 'Please enter a valid email address';
    if (!date) return 'Date of birth is required';
    return '';
  };

  // ---------- handlers: date ----------
  const handleDateInputChange = (text: string) => {
    setError(null);
    const digits = onlyDigits(text).slice(0, 8);
    const formatted = formatAsMMDDYYYY(digits);
    setDateInputText(formatted);
    if (formatted.length === 10) {
      setSelectedDate(tryParseMMDDYYYY(formatted));
    } else {
      setSelectedDate(null);
    }
  };
  const handleCalendarIconPress = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'date';
      input.max = new Date().toISOString().split('T')[0];
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          const date = new Date(target.value);
          setSelectedDate(date);
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const yyyy = String(date.getFullYear());
          setDateInputText(`${mm}/${dd}/${yyyy}`);
          setError(null);
        }
      };
      input.click();
    } else {
      setShowDatePicker(true);
    }
  };
  const handleDatePickerChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = String(date.getFullYear());
      setDateInputText(`${mm}/${dd}/${yyyy}`);
      setError(null);
    }
  };

  // ---------- route to create ----------
  const pushToCreate = (member: MemberRow) => {
    const formattedDob = member.dob ? formatDateForStorage(member.dob) : '';
    router.push({
      pathname: '/auth/create-account',
      params: {
        memberId: String(member.member_id ?? ''),
        email: safeLower(member.email ?? ''), // normalize before passing
        firstName: String(member.first_name ?? ''),
        lastName: String(member.last_name ?? ''),
        productId: String(member.product_id ?? ''),
        productLabel: String(member.product_label ?? ''),
        productBenefit: String(member.product_benefit ?? ''),
        agentId: String(member.agent_id ?? ''),
        dob: formattedDob,
        isPrimary: String(Boolean(member.is_primary)),
        relationship: String(member.relationship ?? ''),
        primaryId: String(member.primary_id ?? ''),
      },
    });
  };

  // ---------- core: verify ----------
  const handleVerifyMembership = async () => {
    try {
      setError(null);
      setNotice(null);
      if (locked) {
        setError(`Too many attempts. Try again in ${secondsLeft}s.`);
        return;
      }
      if (attempts >= MAX_ATTEMPTS) {
        setLockUntil(Date.now() + LOCK_MS);
        setAttempts(0);
        setError('Too many attempts. Locked for 5 minutes.');
        return;
      }

      let validationError = '';
      if (verificationMethod === 'memberId') {
        validationError = validateMemberId(memberId);
      } else {
        validationError = validateEmailDob(emailLower, selectedDate);
      }
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsLoading(true);

      if (verificationMethod === 'memberId') {
        // 1) If already registered, route to Sign In
        const { data: existingUser, error: existingErr } = await supabase
          .from('users')
          .select('member_id, email')
          .eq('member_id', memberId.trim())
          .maybeSingle();
        if (existingErr) throw existingErr;
        if (existingUser) {
          router.push({ pathname: '/auth/sign-in', params: { email: safeLower(existingUser.email ?? '') } as any });
          return;
        }

        // 2) Find membership
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('member_id', memberId.trim())
          .maybeSingle<MemberRow>();
        if (memberError) throw memberError;
        if (!member) {
          setAttempts((p) => p + 1);
          setError('Member ID not found. Please verify or contact support.');
          return;
        }

        // 3) Dependent with missing email → collect
        const hasEmail =
          !!member.email &&
          String(member.email).trim() !== '' &&
          String(member.email).toUpperCase() !== 'NULL';
        if (member.is_primary === false && !hasEmail) {
          setDependentMember(member);
          setShowEmailInput(true);
          setNotice('We found your membership. Please add an email to create your login.');
          return;
        }

        // 4) Good → go create
        pushToCreate({ ...member, email: safeLower(member.email ?? '') });
      } else {
        // email + dob path
        const dobString = formatDateToYYYYMMDD(selectedDate!);

        // 1) If already registered, route to Sign In (case-insensitive by using lower)
        const { data: existingUser, error: existingErr } = await supabase
          .from('users')
          .select('email')
          .ilike('email', emailLower)
          .eq('dob', dobString)
          .maybeSingle();
        if (existingErr) throw existingErr;
        if (existingUser) {
          router.push({ pathname: '/auth/sign-in', params: { email: safeLower(existingUser.email ?? '') } as any });
          return;
        }

        // 2) Verify membership
        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('*')
          .ilike('email', emailLower)
          .eq('dob', dobString)
          .maybeSingle<MemberRow>();
        if (memberError) throw memberError;
        if (!member) {
          setAttempts((p) => p + 1);
          setError('No membership found with this email and date of birth. Please verify or contact support.');
          return;
        }

        pushToCreate({ ...member, email: safeLower(member.email ?? emailLower) });
      }
    } catch (e: any) {
      console.error('Verify error:', e);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- dependent email add ----------
  const handleAddDependentEmail = async () => {
    try {
      setError(null);
      setNotice(null);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!dependentEmailLower) {
        setError('Email is required');
        return;
      }
      if (!emailRegex.test(dependentEmailLower)) {
        setError('Please enter a valid email address');
        return;
      }
      if (!dependentMember) {
        setError('Missing dependent context. Please try again.');
        return;
      }

      setIsLoading(true);

      // Prevent email collisions: if email already belongs to another user, block
      const { data: emailTaken, error: emailErr } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', dependentEmailLower)
        .maybeSingle();
      if (emailErr) throw emailErr;
      if (emailTaken) {
        setError('This email is already in use. Please use a different email address.');
        return;
      }

      // Update dependent email in members
      const { error: updateError } = await supabase
        .from('members')
        .update({ email: dependentEmailLower })
        .eq('member_id', dependentMember.member_id);
      if (updateError) throw updateError;

      const updated = { ...dependentMember, email: dependentEmailLower } as MemberRow;
      pushToCreate(updated);
    } catch (e: any) {
      console.error('Add dependent email error:', e);
      setError('Failed to add email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
          <Text style={styles.title}>Create App Login</Text>
          <Text style={styles.subtitle}>
            Verify your membership to set up your app login.
          </Text>

          {!!notice && !error && (
            <View style={styles.noticeContainer}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}
          {!!error && (
            <View style={styles.errorContainer} accessibilityLiveRegion="polite">
              <AlertCircle size={20} color={colors.status.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
              {locked && (
                <Text style={styles.helperText}>
                  Locked due to too many attempts. Try again in {secondsLeft}s.
                </Text>
              )}
            </View>
          )}

          {showEmailInput ? (
            <>
              <View style={styles.dependentInfoCard}>
                <Text style={styles.dependentInfoTitle}>Almost there!</Text>
                <Text style={styles.dependentInfoText}>
                  We found the membership for {dependentMember?.first_name} {dependentMember?.last_name}.{"\n"}
                  Add an email to use for your app login.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  value={dependentEmail}
                  onChangeText={(text) => {
                    setDependentEmail(text);
                    setError(null);
                  }}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  accessibilityLabel="Dependent email address"
                  placeholderTextColor={colors.text.secondary}
                />
                <Text style={styles.helperText}>This will be your login email for the app</Text>
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, (isLoading || locked) && styles.buttonDisabled]}
                onPress={handleAddDependentEmail}
                disabled={isLoading || locked}
              >
                <Text style={styles.verifyButtonText}>
                  {isLoading ? 'Adding Email...' : 'Continue with Email'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowEmailInput(false);
                  setDependentMember(null);
                  setDependentEmail('');
                  setError(null);
                  setNotice(null);
                }}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Toggle */}
              <View style={styles.toggleContainer} accessibilityRole="tablist">
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: verificationMethod === 'memberId' }}
                  style={[
                    styles.toggleButton,
                    styles.toggleButtonLeft,
                    verificationMethod === 'memberId' && styles.toggleButtonActive,
                  ]}
                  onPress={() => {
                    setVerificationMethod('memberId');
                    setError(null);
                    setNotice(null);
                  }}
                >
                  <User
                    size={20}
                    color={verificationMethod === 'memberId' ? colors.background.default : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      verificationMethod === 'memberId' && styles.toggleButtonTextActive,
                    ]}
                  >
                    Member ID
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: verificationMethod === 'emailDob' }}
                  style={[
                    styles.toggleButton,
                    styles.toggleButtonRight,
                    verificationMethod === 'emailDob' && styles.toggleButtonActive,
                  ]}
                  onPress={() => {
                    setVerificationMethod('emailDob');
                    setError(null);
                    setNotice(null);
                  }}
                >
                  <Mail
                    size={20}
                    color={verificationMethod === 'emailDob' ? colors.background.default : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      verificationMethod === 'emailDob' && styles.toggleButtonTextActive,
                    ]}
                  >
                    Email & DOB
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Member ID */}
              {verificationMethod === 'memberId' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Member ID</Text>
                  <TextInput
                    style={[styles.input, error ? styles.inputError : null]}
                    value={memberId}
                    onChangeText={(text) => {
                      setMemberId(text);
                      setError(null);
                      setNotice(null);
                    }}
                    placeholder="Enter your Member ID"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Member ID"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
              )}

              {/* Email & DOB */}
              {verificationMethod === 'emailDob' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={[styles.input, error ? styles.inputError : null]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError(null);
                        setNotice(null);
                      }}
                      placeholder="Enter your email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      accessibilityLabel="Email address"
                      placeholderTextColor={colors.text.secondary}
                    />
                    <Text style={styles.helperText}>We’ll use this for your login.</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Date of Birth</Text>
                    <View style={[styles.dateInputContainer, error ? styles.inputError : null]}>
                      <TextInput
                        style={styles.dateInput}
                        value={dateInputText}
                        onChangeText={handleDateInputChange}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor={colors.text.secondary}
                        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                        maxLength={10}
                        accessibilityLabel="Date of birth"
                      />
                      <TouchableOpacity style={styles.calendarButton} onPress={handleCalendarIconPress} accessibilityLabel="Open date picker">
                        <Calendar size={20} color={colors.primary.main} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>Enter manually or tap the calendar</Text>
                  </View>

                  {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={selectedDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={handleDatePickerChange}
                      maximumDate={new Date()}
                    />
                  )}

                  {Platform.OS === 'ios' && (
                    <Modal
                      visible={showDatePicker}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowDatePicker(false)}
                    >
                      <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)} />
                      <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                          <Text style={styles.pickerTitle}>Select Date of Birth</Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.pickerDoneBtn}>
                            <Text style={styles.pickerDoneText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDate || new Date(1990, 0, 1)}
                          mode="date"
                          display="spinner"
                          onChange={handleDatePickerChange}
                          maximumDate={new Date()}
                          style={styles.iosPicker}
                          themeVariant="light"
                        />
                      </View>
                    </Modal>
                  )}
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (isLoading || locked) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyMembership}
                disabled={isLoading || locked}
              >
                <Text style={styles.verifyButtonText}>
                  {isLoading ? 'Verifying...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!showEmailInput && (
            <>
              <TouchableOpacity style={styles.supportContainer} onPress={() => router.push('/auth/member-support')}>
                <Text style={styles.supportText}>Need help? Contact our Concierge team</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signInContainer} onPress={() => router.push('/auth/sign-in')}>
                <Text style={styles.signInText}>
                  Already created a login? <Text style={styles.signInLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  title: { ...typography.h2, fontWeight: '700' as const, color: colors.text.primary, textAlign: 'center' as const, marginBottom: spacing.sm },
  subtitle: { ...typography.body1, color: colors.text.secondary, textAlign: 'center' as const, lineHeight: 22, marginBottom: spacing.xl },

  noticeContainer: { backgroundColor: `${colors.primary.main}10`, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  noticeText: { ...typography.body2, color: colors.primary.main },

  dependentInfoCard: { backgroundColor: `${colors.primary.main}08`, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  dependentInfoTitle: { ...typography.h3, color: colors.primary.main, marginBottom: spacing.xs, textAlign: 'center' },
  dependentInfoText: { ...typography.body1, color: colors.primary.main, textAlign: 'center', lineHeight: 22 },

  toggleContainer: { flexDirection: 'row', backgroundColor: colors.background.paper, borderRadius: borderRadius.lg, padding: spacing.xs, marginBottom: spacing.xl },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
  toggleButtonLeft: { marginRight: spacing.xs / 2 },
  toggleButtonRight: { marginLeft: spacing.xs / 2 },
  toggleButtonActive: { backgroundColor: colors.primary.main, ...shadows.sm },
  toggleButtonText: { ...typography.body2, fontWeight: '600' as const, color: colors.text.secondary },
  toggleButtonTextActive: { color: colors.background.default },

  errorContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: `${colors.status.error}10`, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg },
  errorIcon: { marginRight: spacing.sm, marginTop: 2 },
  errorText: { flex: 1, ...typography.body2, color: colors.status.error },

  inputContainer: { marginBottom: spacing.lg },
  label: { ...typography.body2, fontWeight: '600' as const, color: colors.text.primary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background.paper, borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.lg, padding: spacing.md, ...typography.body1, color: colors.text.primary },
  inputError: { borderColor: colors.status.error },

  dateInputContainer: { backgroundColor: colors.background.paper, borderWidth: 1, borderColor: colors.gray[200], borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center' },
  dateInput: { flex: 1, padding: spacing.md, ...typography.body1, color: colors.text.primary },
  calendarButton: { padding: spacing.md, marginLeft: spacing.xs },

  helperText: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.xs },

  verifyButton: { backgroundColor: colors.primary.main, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' as const, marginBottom: spacing.xl, ...shadows.md },
  buttonDisabled: { opacity: 0.6 },
  verifyButtonText: { ...typography.body1, fontWeight: '700' as const, color: colors.background.default },

  backButton: { alignItems: 'center', marginBottom: spacing.lg },
  backButtonText: { ...typography.body2, color: colors.text.secondary, textDecorationLine: 'underline' },

  supportContainer: { alignItems: 'center', marginBottom: spacing.md },
  supportText: { ...typography.body2, color: colors.primary.main, textDecorationLine: 'underline' },
  signInContainer: { alignItems: 'center' },
  signInText: { ...typography.body2, color: colors.text.secondary },
  signInLink: { color: colors.primary.main, fontWeight: '700' as const },

  // iOS picker modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  pickerSheet: { backgroundColor: colors.background.default, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingBottom: Platform.OS === 'ios' ? spacing.lg : 0 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  pickerTitle: { ...typography.body1, color: colors.text.primary, fontWeight: '700' as const },
  pickerDoneBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary.main },
  pickerDoneText: { ...typography.body2, color: colors.background.default, fontWeight: '700' as const },
  iosPicker: { backgroundColor: colors.background.default },
});
