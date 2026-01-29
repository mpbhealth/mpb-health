import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
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
  Users,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { signOutUser } from '@/lib/auth';
import { useUserData } from '@/hooks/useUserData';
import { colors, borderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
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
  const { isTablet } = useResponsive();

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
          ? [{ title: 'Create App Login', description: 'Set up app login for your dependents', icon: Users, route: '/activate-dependents', color: colors.primary.main }]
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
      <Animated.View
        entering={FadeInDown.delay(80)}
        style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 8 : responsiveSize.lg }]}
      >
        <SmartText variant="h2" style={styles.title}>My Profile</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsiveSize.xl }]}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInDown.delay(160)}>
            <Card padding="md" variant="elevated" style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <SmartText variant="h3" style={styles.avatarText}>{initials}</SmartText>
                </View>
              </View>

              <View style={styles.profileInfo}>
                {loading ? (
                  <>
                    <View style={styles.skeletonName} />
                    <View style={styles.skeletonEmail} />
                  </>
                ) : (
                  <>
                    <Animated.View entering={FadeInUp.delay(220)}>
                      <SmartText variant="h3" style={styles.name}>
                        {`${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`}
                      </SmartText>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(260)}>
                      <SmartText variant="body1" style={styles.email} maxLines={1}>
                        {userData?.email}
                      </SmartText>
                    </Animated.View>
                  </>
                )}
              </View>
            </Card>
          </Animated.View>

          {menuSections.map((sec, sIdx) => (
            <Animated.View key={sec.title} entering={FadeInUp.delay(220 + sIdx * 80)} layout={Layout.springify()} style={styles.section}>
              <SmartText variant="caption" style={styles.sectionTitle}>{sec.title}</SmartText>

              <Card padding="none" variant="elevated" style={styles.cardList}>
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
                        <item.icon size={moderateScale(20)} color={item.color} />
                      </View>

                      <View style={styles.menuTextWrap}>
                        <SmartText variant="body1" style={styles.menuTitle}>
                          {item.title}
                        </SmartText>
                        <SmartText variant="body2" style={styles.menuDesc}>
                          {item.description}
                        </SmartText>
                      </View>
                    </View>

                    <ChevronRight size={moderateScale(18)} color={colors.gray[400]} />
                  </AnimatedTouchableOpacity>
                ))}
              </Card>
            </Animated.View>
          ))}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutConfirm(true)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LogOut size={moderateScale(20)} color={colors.status.error} />
            <SmartText variant="body1" style={styles.logoutText}>Log Out</SmartText>
          </TouchableOpacity>

          <SmartText variant="caption" style={styles.version}>Version 1.0.0</SmartText>
        </View>
      </ScrollView>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Animated.View style={styles.modalOverlay} entering={FadeIn}>
          <Card padding="lg" variant="elevated" style={styles.modalCard}>
            <SmartText variant="h3" style={styles.modalTitle}>Log Out</SmartText>
            <SmartText variant="body1" style={styles.modalMessage}>Are you sure you want to log out?</SmartText>
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowLogoutConfirm(false)} activeOpacity={0.85}>
                <SmartText variant="body1" style={styles.cancelBtnText}>Cancel</SmartText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleLogout} activeOpacity={0.9}>
                <SmartText variant="body1" style={styles.confirmBtnText}>Log Out</SmartText>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper
  },

  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...platformStyles.shadowSm,
  },
  title: {
    color: colors.text.primary,
    fontWeight: '700'
  },

  content: {
    flex: 1
  },
  scrollContent: {
    padding: responsiveSize.md
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
  },
  avatarContainer: {
    marginRight: responsiveSize.md,
  },
  avatar: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.default,
  },
  avatarText: {
    fontWeight: '700',
    color: colors.primary.main
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  name: {
    color: colors.text.primary,
    fontWeight: '700'
  },
  email: {
    color: colors.text.secondary
  },

  skeletonName: {
    width: '60%',
    height: moderateScale(24),
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.sm,
  },
  skeletonEmail: {
    width: '80%',
    height: moderateScale(20),
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.sm,
  },

  section: {
    marginBottom: responsiveSize.lg
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: responsiveSize.sm,
    textTransform: 'uppercase',
  },

  cardList: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.sm,
    backgroundColor: colors.background.default,
    minHeight: MIN_TOUCH_TARGET,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100]
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: responsiveSize.sm,
    minWidth: 0,
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },
  menuTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  menuTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  menuDesc: {
    color: colors.text.secondary
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rgbaFromHex(colors.status.error, 0.08),
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    marginTop: responsiveSize.md,
    minHeight: MIN_TOUCH_TARGET,
    gap: responsiveSize.xs,
    ...platformStyles.shadowSm,
  },
  logoutText: {
    fontWeight: '700',
    color: colors.status.error
  },
  version: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: responsiveSize.lg,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: moderateScale(420),
  },
  modalTitle: {
    color: colors.text.primary,
    marginBottom: responsiveSize.xs,
    fontWeight: '700'
  },
  modalMessage: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.lg
  },
  modalRow: {
    flexDirection: 'row',
    gap: responsiveSize.sm
  },
  modalBtn: {
    flex: 1,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.gray[100]
  },
  confirmBtn: {
    backgroundColor: colors.status.error
  },
  cancelBtnText: {
    fontWeight: '700',
    color: colors.text.secondary
  },
  confirmBtnText: {
    fontWeight: '700',
    color: colors.background.default
  },
});
