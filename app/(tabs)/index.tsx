// src/screens/HomeScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play,
  Tag,
  Users as Users2,
  Wallet,
  MessageSquare,
  ChevronRight,
  Bell,
  HelpCircle,
  FlaskRound as Flask,
  Heart,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logoImg = require('../../assets/images/logo.png');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const ANDROID = Platform.OS === 'android';

const TELE_DERM_DISCLAIMER =
  'Telehealth includes Urgent Care, Primary Care, Mental Health, and Pet Telehealth. Your dermatology benefit includes 3 free visits per family, per year. After that there is a $60 consultation fee.';

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  color: string;
  gradient: string;
};

function AnimatedServiceCard({
  service,
  index,
  onPress,
  containerStyle,
}: {
  service: Service;
  index: number;
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.2, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.1, { duration: 150 });
  };

  return (
    <AnimatedTouchable
      style={[styles.serviceCard, styles.cardSurface, animatedStyle, containerStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInUp.delay(300 + index * 100)}
      layout={Layout.springify()}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open ${service.title}`}
    >
      <View style={styles.serviceCardContent}>
        <View style={[styles.serviceIconContainer, { backgroundColor: service.gradient }]}>
          <service.icon size={26} color={service.color} />
        </View>
        <View style={styles.serviceTextContainer}>
          <Text style={styles.serviceTitle} numberOfLines={1} ellipsizeMode="tail">
            {service.title}
          </Text>
          <Text style={styles.serviceDescription} numberOfLines={2} ellipsizeMode="tail">
            {service.description}
          </Text>
        </View>
      </View>
      <View style={[styles.chevronContainer, { backgroundColor: service.gradient }]}>
        <ChevronRight size={18} color={service.color} />
      </View>
    </AnimatedTouchable>
  );
}

function QuickActionCard({
  action,
  onPress,
}: {
  action: {
    title: string;
    route: string;
    color: string;
    gradient: string;
    icon: LucideIcon;
  };
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.2, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.1, { duration: 150 });
  };

  return (
    <AnimatedTouchable
      style={[styles.quickActionCard, styles.cardSurface, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open ${action.title.replace('\n', ' ')}`}
    >
      <View style={[styles.quickActionIconContainer, { backgroundColor: action.gradient }]}>
        <action.icon size={24} color={action.color} />
      </View>
      <Text style={styles.quickActionText} numberOfLines={2} ellipsizeMode="tail">
        {action.title}
      </Text>
    </AnimatedTouchable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { userData, loading } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnreadNotifications] = useState(true);
  const [showTelehealthDisclaimer, setShowTelehealthDisclaimer] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const svcCols = useMemo(() => (isTablet ? 2 : 1), [isTablet]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const healthWalletProductIds = new Set(['44036', '45800', '45388', '46455', '45742']);
  const shouldShowHealthWallet = healthWalletProductIds.has(userData?.normalized_product_id ?? userData?.product_id ?? '');
  const hospitalDebtReliefProductIds = new Set(['42463', '45388']);
  const normalizedProductId = userData?.normalized_product_id ?? userData?.product_id;

  const quickActions = [
    { title: 'RX &\nDiagnostics', route: '/labs-testing', color: colors.primary.main, gradient: rgbaFromHex(colors.primary.main, 0.15), icon: Flask },
    { title: 'Member\nForms', route: '/member-services', color: colors.secondary.main, gradient: rgbaFromHex(colors.secondary.main, 0.15), icon: MessageSquare },
    { title: 'Find\nDiscounts', route: '/discounts', color: colors.primary.dark, gradient: rgbaFromHex(colors.primary.dark, 0.15), icon: Tag },
  ] as const;

  const allServices: Service[] = [
    ...(shouldShowHealthWallet
      ? [
          {
            title: 'Health Wallet',
            description: 'Access your digital health wallet and benefits',
            icon: Wallet,
            route: '/health-wallet',
            color: colors.primary.main,
            gradient: rgbaFromHex(colors.primary.main, 0.15),
          },
        ]
      : [
          {
            title: 'Telehealth',
            description: 'Access Unlimited Virtual Urgent Care, Primary Care, and Mental Health Options',
            icon: Stethoscope,
            route: '/telehealth-sso',
            color: colors.primary.main,
            gradient: rgbaFromHex(colors.primary.main, 0.15),
          },
        ]),
    {
      title: 'Care Services',
      description: 'Find providers and access other medical services',
      icon: Heart,
      route: '/care',
      color: colors.secondary.main,
      gradient: rgbaFromHex(colors.secondary.main, 0.15),
    },
    {
      title: hospitalDebtReliefProductIds.has(String(normalizedProductId || '')) ? 'Hospital Debt Relief' : 'Sharing',
      description: hospitalDebtReliefProductIds.has(String(normalizedProductId || '')) ? 'Eligibility Application' : 'Submit and manage medical needs',
      icon: Users2,
      route: hospitalDebtReliefProductIds.has(String(normalizedProductId || '')) ? '/hospital-debt-relief' : '/sharing',
      color: colors.primary.main,
      gradient: rgbaFromHex(colors.primary.main, 0.15),
    },
    {
      title: 'HealthCare Podcast',
      description: 'Watch health and wellness videos to stay informed',
      icon: Play,
      route: '/healthy-podcast',
      color: colors.secondary.dark,
      gradient: rgbaFromHex(colors.secondary.dark, 0.15),
    },
  ];

  const handleServicePress = (svc: Service) => {
    if (svc.route === '/telehealth-sso') {
      setShowTelehealthDisclaimer(true);
      return;
    }
    router.push(svc.route as never);
  };

  const handleConfirmTelehealth = () => {
    setShowTelehealthDisclaimer(false);
    router.push('/telehealth-sso' as never);
  };

  if (loading) return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 8 : spacing.xl }]}
      >
        <View style={[styles.headerContent, isTablet && styles.tabletHeaderContent]}>
          <View style={styles.headerTop}>
            <Animated.Image source={logoImg} style={styles.logo} resizeMode="contain" entering={FadeInUp.delay(150)} />
            <Animated.View style={styles.headerActions} entering={FadeInUp.delay(200)}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/what-to-do')}>
                <HelpCircle size={22} color={colors.primary.main} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
                <Bell size={22} color={colors.primary.main} />
                {hasUnreadNotifications && (
                  <View style={styles.badgeOuter}>
                    <View style={styles.badgeInner} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View style={styles.welcomeSection} entering={FadeInUp.delay(250)}>
            <Text style={styles.greeting}>Hi, {userData?.first_name || 'Member'}!</Text>
            <Text style={styles.welcomeMessage}>Here's your health dashboard</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* CONTENT */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.main} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* QUICK ACTIONS */}
        <Animated.View style={[styles.quickActionsSection, isTablet && styles.tabletQuickActionsSection]} entering={FadeInUp.delay(300)}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} action={action} onPress={() => router.push(action.route as never)} />
            ))}
          </View>
        </Animated.View>

        {/* SERVICES */}
        <Animated.View style={styles.servicesSection} entering={FadeInUp.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Services</Text>
            <Text style={styles.sectionSubtitle}>Quick access to your care options</Text>
          </View>

          <View style={[styles.servicesGrid, isTablet && styles.tabletServicesGrid]}>
            {allServices.map((svc, idx) => (
              <AnimatedServiceCard
                key={svc.title}
                service={svc}
                index={idx}
                onPress={() => handleServicePress(svc)}
                containerStyle={[
                  styles.serviceCardContainer,
                  isTablet && styles.serviceCardTablet,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Telehealth Disclaimer Modal (single action) */}
      <Modal
        transparent
        visible={showTelehealthDisclaimer}
        animationType="fade"
        onRequestClose={() => setShowTelehealthDisclaimer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.cardSurface]}>
            <Text style={styles.modalTitle}>Before you continue</Text>
            <Text style={styles.modalMessage}>{TELE_DERM_DISCLAIMER}</Text>

            <TouchableOpacity
              style={[styles.modalBtn, styles.confirmBtn]}
              onPress={handleConfirmTelehealth}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Continue to Telehealth"
            >
              <Text style={styles.confirmBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FONT_SIZE = 14;
const LINE_HEIGHT = 18;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },

  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...shadows.sm,
  },
  headerContent: { width: '100%' },
  tabletHeaderContent: { maxWidth: 1200, alignSelf: 'center' },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerActions: { flexDirection: 'row' },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    ...(ANDROID
      ? {
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: rgbaFromHex(colors.gray[400], 0.35),
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        }),
  },
  badgeOuter: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
    ...(ANDROID
      ? { elevation: 4, shadowColor: 'transparent' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 1.5 }),
  },
  badgeInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.status.error,
  },

  logo: { width: 120, height: 32 },
  welcomeSection: { paddingLeft: spacing.xs },
  greeting: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs, fontWeight: '700' },
  welcomeMessage: { ...typography.body1, color: colors.text.secondary, fontWeight: '400' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  // Reusable surface
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

  // Quick actions
  quickActionsSection: { marginBottom: spacing.xl },
  tabletQuickActionsSection: { maxWidth: 900, alignSelf: 'center', width: '100%' },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 100,
    maxWidth: 160,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...(!ANDROID ? shadows.sm : null),
    minHeight: 120,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.08),
  },
  quickActionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },

  // Services
  servicesSection: { flex: 1 },
  sectionHeader: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.xs / 2 },
  sectionSubtitle: { ...typography.body1, color: colors.text.secondary, fontWeight: '400' },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tabletServicesGrid: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },

  serviceCardContainer: {
    width: '100%',
  },
  serviceCardTablet: {
    width: '48%',
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
    ...(!ANDROID ? shadows.sm : null),
  },
  serviceCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  serviceTextContainer: { flex: 1, minWidth: 0 },
  serviceTitle: { ...typography.h4, color: colors.text.primary, marginBottom: spacing.xs / 2, fontWeight: '600' },
  serviceDescription: { ...typography.body2, color: colors.text.secondary, fontWeight: '400', lineHeight: 20 },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal (single action)
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
    maxWidth: 460,
    ...(!ANDROID ? shadows.lg : null),
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.sm, fontWeight: '700' as const },
  modalMessage: { ...typography.body1, color: colors.text.secondary, marginBottom: spacing.lg },
  modalBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  confirmBtn: { backgroundColor: colors.primary.main },
  confirmBtnText: { ...typography.body1, fontWeight: '700' as const, color: colors.background.default },
});
