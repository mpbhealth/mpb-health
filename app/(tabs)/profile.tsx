// src/screens/ProfileScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  User,
  Key,
  Shield,
  UserCog,
  FileText,
  Lock,
  LogOut,
  ChevronRight,
  Copy as CopyIcon,
  Users,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { signOutUser } from '@/lib/auth';
import { useUserData } from '@/hooks/useUserData';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ANDROID = Platform.OS === 'android';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getInitials(fname?: string | null, lname?: string | null) {
  const f = (fname || '').trim();
  const l = (lname || '').trim();
  return `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase() || 'M';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { userData, loading } = useUserData();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const insets = useSafeAreaInsets();

  const initials = useMemo(
    () => getInitials(userData?.first_name, userData?.last_name),
    [userData?.first_name, userData?.last_name]
  );

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.replace('/auth/sign-in' as any);
    } catch (err) {
      console.error(err);
    }
  };

  const copyMemberId = async () => {
    if (!userData?.member_id) return;
    await Clipboard.setStringAsync(String(userData.member_id));
    if (Platform.OS === 'web') {
      alert('Copied to clipboard: ' + userData.member_id);
    } else {
      Alert.alert('Copied to clipboard', String(userData.member_id));
    }
  };

  // SHOW Member ID only when loading (placeholder) OR when user is primary
  const showMemberIdRow = loading || Boolean(userData?.is_primary);

  const menuSections = [
    {
      title: 'Account',
      items: [
        { title: 'Personal Information', description: 'Manage your personal details', icon: User, route: '/member-information', color: colors.primary.main },
        { title: 'Security', description: 'Password and authentication', icon: Key, route: '/profile-settings', color: colors.secondary.main },
      ],
    },
    {
      title: 'Membership',
      items: [
        { title: 'Plan Details', description: 'View your health plan information', icon: Shield, route: '/plan-details', color: colors.primary.dark },
        { title: 'My Advisor', description: 'Contact your dedicated health advisor', icon: UserCog, route: '/my-advisor', color: colors.secondary.dark },
        ...(userData?.is_primary
          ? [{ title: 'Activate Dependents', description: 'Set up accounts for your dependents', icon: Users, route: '/activate-dependents', color: colors.primary.main }]
          : []),
        { title: 'What to do?', description: 'Learn what to do in different medical situations', icon: FileText, route: '/what-to-do', color: colors.secondary.dark },
      ],
    },
    {
      title: 'Support',
      items: [{ title: 'Privacy & Terms', description: 'Review our policies', icon: Lock, route: '/privacy-policy', color: colors.primary.light }],
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* HEADER */}
      <Animated.View
        entering={FadeInDown.delay(80)}
        style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 8 : spacing.xl }]}
      >
        <Text style={styles.title}>My Profile</Text>
      </Animated.View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {/* USER CARD */}
        <Animated.View entering={FadeInDown.delay(160)} style={[styles.profileCard, styles.cardSurface]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Animated.Text style={[styles.name, loading && styles.placeholderText]} entering={FadeInUp.delay(220)}>
              {loading ? 'Loading…' : `${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`}
            </Animated.Text>

            <Animated.Text style={[styles.email, loading && styles.placeholderText]} entering={FadeInUp.delay(260)} numberOfLines={1}>
              {loading ? 'Loading…' : userData?.email}
            </Animated.Text>

            {/* Member ID — only for primary users (or while loading placeholder) */}
            {showMemberIdRow && (
              <Animated.View entering={FadeInUp.delay(300)} style={[styles.memberIdRow, loading && styles.placeholderText]}>
                <Text style={styles.memberIdText}>
                  {loading ? 'Loading…' : `Member ID: ${userData?.member_id ?? ''}`}
                </Text>
                {!loading && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Copy Member ID"
                    onPress={copyMemberId}
                    style={styles.copyIconBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.8}
                  >
                    <CopyIcon size={18} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* MENU SECTIONS */}
        {menuSections.map((sec, sIdx) => (
          <Animated.View key={sec.title} entering={FadeInUp.delay(220 + sIdx * 80)} layout={Layout.springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>

            <View style={[styles.cardList, styles.cardSurface]}>
              {sec.items.map((item, idx) => (
                <AnimatedTouchableOpacity
                  key={item.title}
                  style={[styles.menuItem, idx !== sec.items.length - 1 && styles.menuItemDivider]}
                  onPress={() => router.push(item.route as never)}
                  disabled={loading}
                  entering={FadeInUp.delay(260 + idx * 50)}
                  layout={Layout.springify()}
                  activeOpacity={0.85}
                >
                  <View style={styles.menuLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: rgbaFromHex(item.color, 0.12) }]}>
                      <item.icon size={20} color={item.color} />
                    </View>

                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                  </View>

                  <ChevronRight size={18} color={colors.gray[400]} />
                </AnimatedTouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* LOGOUT */}
        <TouchableOpacity style={[styles.logoutButton, styles.cardSurface]} onPress={() => setShowLogoutConfirm(true)} disabled={loading} activeOpacity={0.85}>
          <LogOut size={20} color={colors.status.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* LOGOUT MODAL */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Animated.View style={styles.modalOverlay} entering={FadeIn}>
          <View style={[styles.modalCard, styles.cardSurface]}>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowLogoutConfirm(false)} activeOpacity={0.85}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleLogout} activeOpacity={0.9}>
                <Text style={styles.confirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },

  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
  },
  title: { ...typography.h2, color: colors.text.primary, fontWeight: '700' },

  content: { flex: 1 },
  scrollContent: { padding: spacing.lg },

  cardSurface: ANDROID
    ? {
        elevation: 0,
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: rgbaFromHex(colors.gray[400], 0.25),
      }
    : {},

  profileCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...(!ANDROID ? shadows.md : null),
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    marginRight: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.default,
    ...(!ANDROID ? {
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    } : {}),
  },
  avatarText: { ...typography.h3, fontWeight: '700', color: colors.primary.main },
  profileInfo: { flex: 1, minWidth: 0 },
  name: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs, fontWeight: '700' },
  email: { ...typography.body1, color: colors.text.secondary, marginBottom: spacing.sm },

  memberIdRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs / 2 },
  memberIdText: { ...typography.body1, color: colors.primary.main, fontWeight: '600' },
  copyIconBtn: { padding: spacing.xs, flexShrink: 0 },

  placeholderText: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.sm,
    opacity: 0.7,
  },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  cardList: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    ...(!ANDROID ? shadows.sm : null),
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.default,
  },
  menuItemDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md, minWidth: 0 },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuTextWrap: { flex: 1, minWidth: 0 },
  menuTitle: { ...typography.body1, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  menuDesc: { ...typography.body2, color: colors.text.secondary },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rgbaFromHex(colors.status.error, 0.08),
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...(!ANDROID ? shadows.sm : null),
    marginTop: spacing.lg,
  },
  logoutText: { ...typography.body1, fontWeight: '700', color: colors.status.error, marginLeft: spacing.xs },
  version: {
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    ...(!ANDROID ? shadows.lg : null),
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs, fontWeight: '700' },
  modalMessage: { ...typography.body1, color: colors.text.secondary, marginBottom: spacing.lg },
  modalRow: { flexDirection: 'row', gap: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.gray[100] },
  confirmBtn: { backgroundColor: colors.status.error },
  cancelBtnText: { ...typography.body1, fontWeight: '700', color: colors.text.secondary },
  confirmBtnText: { ...typography.body1, fontWeight: '700', color: colors.background.default },
});
