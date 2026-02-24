import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  Image,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play,
  Tag,
  Users as Users2,
  ChevronRight,
  Bell,
  HelpCircle,
  FlaskRound as Flask,
  Heart,
  Stethoscope,
  Pill,
  AlertTriangle,
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
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { colors, borderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';
import { useNotifications } from '@/hooks/useNotifications';
import { useFocusEffect } from 'expo-router';

const logoImg = require('../../assets/images/logo.png');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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
}: {
  service: Service;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={[styles.serviceCard, animatedStyle]}
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
          <service.icon size={moderateScale(24)} color={service.color} />
        </View>
        <View style={styles.serviceTextContainer}>
          <SmartText variant="h4" maxLines={2}>
            {service.title}
          </SmartText>
          <SmartText variant="body2" style={styles.serviceDescription} maxLines={3}>
            {service.description}
          </SmartText>
        </View>
      </View>
      <View style={[styles.chevronContainer, { backgroundColor: service.gradient }]}>
        <ChevronRight size={moderateScale(18)} color={service.color} />
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={[styles.quickActionCard, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open ${action.title.replace('\n', ' ')}`}
    >
      <View style={[styles.quickActionIconContainer, { backgroundColor: action.gradient }]}>
        <action.icon size={moderateScale(20)} color={action.color} />
      </View>
      <SmartText variant="body2" style={styles.quickActionText} maxLines={2}>
        {action.title}
      </SmartText>
    </AnimatedTouchable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { userData, loading } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount, refetch } = useNotifications();
  const hasUnreadNotifications = unreadCount > 0;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  const [showTelehealthDisclaimer, setShowTelehealthDisclaimer] = useState(false);
  const [showPendingActivationModal, setShowPendingActivationModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isTablet, isExtraSmall } = useResponsive();

  const contentPaddingHorizontal = useMemo(
    () => (screenWidth <= 320 ? moderateScale(12) : moderateScale(16)),
    [screenWidth]
  );

  useEffect(() => {
    const dimensionHandler = Dimensions.addEventListener('change', () => {
    });

    return () => {
      dimensionHandler?.remove();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const inactiveDateWarning = useMemo(() => {
    if (!userData?.inactive_date) return null;

    const inactiveDateStr = userData.inactive_date;
    const [year, month, day] = inactiveDateStr.split('-').map(Number);
    const inactiveDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inactiveDate <= today) return null;

    const daysUntilInactive = Math.ceil((inactiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = inactiveDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return { daysUntilInactive, formattedDate };
  }, [userData?.inactive_date]);

  const pendingActivation = useMemo(() => {
    if (!userData?.active_date) return null;

    const activeDateStr = userData.active_date;
    const [year, month, day] = activeDateStr.split('-').map(Number);
    const activeDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    activeDate.setHours(0, 0, 0, 0);

    if (activeDate <= today) return null;

    const daysUntilActive = Math.ceil((activeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = activeDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return { daysUntilActive, formattedDate };
  }, [userData?.active_date]);

  useEffect(() => {
    if (pendingActivation && !loading) {
      setShowPendingActivationModal(true);
    }
  }, [pendingActivation, loading]);

  const healthWalletProductIds = new Set(['44036', '45800', '45388', '46455', '45742','38036']);
  const shouldShowHealthWallet = healthWalletProductIds.has(userData?.normalized_product_id ?? userData?.product_id ?? '');
  const hospitalDebtReliefProductIds = new Set(['42463', '45388']);
  const normalizedProductId = userData?.normalized_product_id ?? userData?.product_id;

  const quickActions = [
    { title: 'RX & Diagnostics', route: '/labs-testing', color: colors.primary.main, gradient: rgbaFromHex(colors.primary.main, 0.15), icon: Flask },
    { title: 'Member Forms', route: '/member-services', color: colors.secondary.main, gradient: rgbaFromHex(colors.secondary.main, 0.15), icon: Users2 },
    { title: 'Find Discounts', route: '/discounts', color: colors.primary.dark, gradient: rgbaFromHex(colors.primary.dark, 0.15), icon: Tag },
  ] as const;

  const allServicesBase = [
    {
      title: 'Telehealth',
      description: 'Virtual Urgent Care, Primary Care, and Mental Health Options',
      icon: Stethoscope,
      route: '/telehealth-sso',
    },
    ...(shouldShowHealthWallet
      ? [
          {
            title: 'Rx Valet and Benefit Card',
            description: 'Access rx valet and benefit card',
            icon: Pill,
            route: '/health-wallet',
          },
        ]
      : []),
    {
      title: 'Care Services',
      description: 'Find providers and access other medical services',
      icon: Heart,
      route: '/care',
    },
    {
      title: hospitalDebtReliefProductIds.has(String(normalizedProductId || '')) ? 'Hospital Debt Relief' : 'Sharing',
      description: hospitalDebtReliefProductIds.has(String(normalizedProductId || '')) ? 'Eligibility Application' : 'Submit and manage medical needs',
      icon: Users2,
      route: hospitalDebtReliefProductIds.has(String(normalizedProductId || '')) ? '/hospital-debt-relief' : '/sharing',
    },
    {
      title: 'HealthCare Podcast',
      description: 'Watch health and wellness videos to stay informed',
      icon: Play,
      route: '/healthy-podcast',
    },
  ];

  const allServices: Service[] = allServicesBase.map((service, index) => {
    const isBlue = index % 2 === 0;
    const color = isBlue ? colors.primary.main : colors.secondary.main;
    const gradient = rgbaFromHex(color, 0.15);

    return {
      ...service,
      color,
      gradient,
    };
  });

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
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: Math.max(insets.top, responsiveSize.sm) + responsiveSize.sm }]}
      >
        <View style={[styles.headerContent, isTablet && styles.tabletHeaderContent]}>
          <View style={styles.headerTop}>
            <View style={styles.logoWrapper}>
              <Animated.Image source={logoImg} style={styles.logo} resizeMode="contain" entering={FadeInUp.delay(150)} />
            </View>
            <Animated.View style={styles.headerActions} entering={FadeInUp.delay(200)}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/what-to-do')}>
                <HelpCircle size={moderateScale(22)} color={colors.primary.main} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
                <Bell size={moderateScale(22)} color={colors.primary.main} />
                {hasUnreadNotifications && (
                  <View style={styles.badgeOuter}>
                    <View style={styles.badgeInner} />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View style={styles.welcomeSection} entering={FadeInUp.delay(250)}>
            <SmartText variant="h2" maxLines={1} truncate>
              Hi, {userData?.first_name || 'Member'}!
            </SmartText>
            <SmartText variant="body1" style={styles.welcomeMessage} maxLines={1} truncate>
              Here's your health dashboard
            </SmartText>
          </Animated.View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.main} />}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: contentPaddingHorizontal, paddingBottom: Math.max(insets.bottom + responsiveSize.xl, responsiveSize.xl * 2) }
        ]}
      >
        {inactiveDateWarning && (
          <Animated.View style={styles.warningBanner} entering={FadeInDown.delay(250)}>
            <View style={styles.warningIconContainer}>
              <AlertTriangle size={moderateScale(20)} color={colors.status.warning} />
            </View>
            <View style={styles.warningContent}>
              <SmartText variant="h4" style={styles.warningTitle} maxLines={1}>
                Membership Ending Soon
              </SmartText>
              <SmartText variant="body2" style={styles.warningMessage}>
                Your membership will end on {inactiveDateWarning.formattedDate} ({inactiveDateWarning.daysUntilInactive} {inactiveDateWarning.daysUntilInactive === 1 ? 'day' : 'days'} remaining). We'd love to keep you as part of our community!{' '}
                <SmartText variant="body2" style={styles.warningLink} onPress={() => router.push('/auth/member-support')}>
                  Contact our Concierge
                </SmartText>
                {' '}to discuss your options and continue your health journey with us.
              </SmartText>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.quickActionsSection, isTablet && styles.tabletQuickActionsSection]} entering={FadeInUp.delay(300)}>
          <View style={[styles.quickActionsGrid, isExtraSmall && styles.quickActionsGridExtraSmall]}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} action={action} onPress={() => router.push(action.route as never)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={styles.servicesSection} entering={FadeInUp.delay(400)}>
          <View style={styles.sectionHeader}>
            <SmartText variant="h3" maxLines={1}>
              Health Services
            </SmartText>
            <SmartText variant="body1" style={styles.sectionSubtitle}>
              Quick access to your care options
            </SmartText>
          </View>

          <View style={[styles.servicesGrid, isTablet && styles.tabletServicesGrid]}>
            {allServices.map((svc, idx) => (
              <View
                key={svc.title}
                style={[styles.serviceCardContainer, isTablet && styles.serviceCardTablet]}
              >
                <AnimatedServiceCard service={svc} index={idx} onPress={() => handleServicePress(svc)} />
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        transparent
        visible={showTelehealthDisclaimer}
        animationType="fade"
        onRequestClose={() => setShowTelehealthDisclaimer(false)}
      >
        <View style={[styles.modalOverlay, {
          paddingTop: Math.max(insets.top, responsiveSize.lg),
          paddingBottom: Math.max(insets.bottom, responsiveSize.lg),
        }]}>
          <Card padding="lg" variant="elevated" style={styles.modalCard}>
            <SmartText variant="h3" maxLines={2} truncate style={styles.modalTitle}>
              Before you continue
            </SmartText>
            <SmartText variant="body1" style={styles.modalMessage}>
              {TELE_DERM_DISCLAIMER}
            </SmartText>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmTelehealth}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Continue to Telehealth"
            >
              <SmartText variant="body1" style={styles.confirmBtnText}>
                Continue
              </SmartText>
            </TouchableOpacity>
          </Card>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showPendingActivationModal}
        animationType="fade"
        onRequestClose={() => setShowPendingActivationModal(false)}
      >
        <View style={[styles.modalOverlay, {
          paddingTop: Math.max(insets.top, responsiveSize.lg),
          paddingBottom: Math.max(insets.bottom, responsiveSize.lg),
        }]}>
          <Card padding="lg" variant="elevated" style={styles.modalCard}>
            <View style={styles.pendingActivationIcon}>
              <AlertTriangle size={moderateScale(32)} color={colors.status.info} />
            </View>
            <SmartText variant="h3" style={styles.pendingActivationTitle}>
              Your Membership Starts Soon
            </SmartText>
            <View style={styles.activationDateContainer}>
              <SmartText variant="h4" style={styles.activationDateLabel}>
                Plan Start Date
              </SmartText>
              <SmartText variant="h3" style={styles.activationDate}>
                {pendingActivation?.formattedDate}
              </SmartText>
              <SmartText variant="body2" style={styles.daysUntilActive}>
                {pendingActivation?.daysUntilActive} {pendingActivation?.daysUntilActive === 1 ? 'day' : 'days'} from now
              </SmartText>
            </View>

            <SmartText variant="body1" style={styles.modalMessage}>
              Your telehealth and other membership features will be available starting {pendingActivation?.formattedDate} when your plan becomes active.
            </SmartText>
            <SmartText variant="body1" style={styles.modalMessageSecondary}>
              In the meantime, schedule a welcome call with our team to learn about your benefits.
            </SmartText>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                setShowPendingActivationModal(false);
                router.push('/member-services' as never);
              }}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Schedule Welcome Call"
            >
              <SmartText variant="body1" style={styles.confirmBtnText}>
                Schedule Welcome Call
              </SmartText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setShowPendingActivationModal(false);
                router.push('/(tabs)/chat' as never);
              }}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Contact Concierge"
            >
              <SmartText variant="body1" style={styles.secondaryBtnText}>
                Contact Concierge
              </SmartText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setShowPendingActivationModal(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <SmartText variant="body2" style={styles.dismissBtnText}>
                Got it
              </SmartText>
            </TouchableOpacity>
          </Card>
        </View>
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
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  headerContent: {
    width: '100%'
  },
  tabletHeaderContent: {
    maxWidth: 1200,
    alignSelf: 'center'
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveSize.md,
    minHeight: 0,
  },
  logoWrapper: {
    flex: 1,
    minWidth: 0,
    marginRight: responsiveSize.sm,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: responsiveSize.xs,
  },

  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    position: 'relative',
    backgroundColor: rgbaFromHex(colors.primary.main, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  badgeOuter: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  badgeInner: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(4.5),
    backgroundColor: colors.status.error,
  },

  logo: {
    width: moderateScale(120),
    height: moderateScale(32),
    maxWidth: '100%',
  },
  welcomeSection: {
    paddingLeft: responsiveSize.xs,
  },
  welcomeMessage: {
    color: colors.text.secondary,
    marginTop: responsiveSize.xs,
  },

  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: responsiveSize.md,
    flexGrow: 1,
  },

  warningBanner: {
    backgroundColor: `${colors.status.warning}15`,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    marginBottom: responsiveSize.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.warning,
    ...platformStyles.shadowSm,
  },
  warningIconContainer: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
  },
  warningContent: {
    flex: 1,
    minWidth: 0,
  },
  warningTitle: {
    color: colors.status.warning,
    fontWeight: '700',
    marginBottom: responsiveSize.xs,
  },
  warningMessage: {
    color: colors.text.primary,
    lineHeight: 20,
  },
  warningLink: {
    color: colors.primary.main,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  quickActionsSection: {
    marginBottom: responsiveSize.lg
  },
  tabletQuickActionsSection: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%'
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveSize.sm,
    flexWrap: 'wrap',
  },
  quickActionsGridExtraSmall: {
    gap: responsiveSize.xs,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: moderateScale(92),
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingVertical: responsiveSize.md,
    paddingHorizontal: responsiveSize.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...platformStyles.shadowSm,
  },
  quickActionIconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize.sm,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.08),
  },
  quickActionText: {
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text.primary,
    lineHeight: moderateScale(16),
    flexShrink: 1,
    width: '100%',
  },

  servicesSection: {
    flex: 1
  },
  sectionHeader: {
    marginBottom: responsiveSize.sm,
    paddingLeft: responsiveSize.xs / 2,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    marginTop: responsiveSize.xs,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSize.sm,
  },
  tabletServicesGrid: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },

  serviceCardContainer: {
    width: '100%',
    minWidth: 0,
  },
  serviceCardTablet: {
    width: '48%',
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 1,
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: moderateScale(104),
    flex: 1,
    minWidth: 0,
    ...platformStyles.shadowSm,
  },
  serviceCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsiveSize.xs,
    minWidth: 0,
    flexShrink: 1,
  },
  serviceIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },
  serviceTextContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
    justifyContent: 'center',
  },
  serviceDescription: {
    color: colors.text.secondary,
  },
  chevronContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
    maxWidth: moderateScale(460),
  },
  modalTitle: {
    color: colors.text.primary,
    marginBottom: responsiveSize.sm,
  },
  modalMessage: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.lg,
  },
  confirmBtn: {
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontWeight: '700',
    color: colors.background.default
  },
  dismissBtn: {
    paddingVertical: responsiveSize.sm,
    alignItems: 'center',
    marginTop: responsiveSize.sm,
  },
  dismissBtnText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  pendingActivationIcon: {
    alignItems: 'center',
    marginBottom: responsiveSize.md,
  },
  pendingActivationTitle: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: responsiveSize.lg,
  },
  dateHighlight: {
    color: colors.primary.main,
    fontWeight: '700',
  },
  activationDateContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: responsiveSize.lg,
    marginBottom: responsiveSize.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.light,
  },
  activationDateLabel: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xs,
    textAlign: 'center',
  },
  activationDate: {
    color: colors.primary.main,
    fontWeight: '700',
    marginBottom: responsiveSize.xs,
    textAlign: 'center',
  },
  daysUntilActive: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalMessageSecondary: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xl,
    textAlign: 'center',
  },
  secondaryBtn: {
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.primary.main,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    marginTop: responsiveSize.sm,
  },
  secondaryBtnText: {
    fontWeight: '600',
    color: colors.primary.main,
  },
});
