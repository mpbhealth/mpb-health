import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Bell, Clock, Calendar, Info, CheckCircle, AlertTriangle, AlertCircle, CreditCard, ShieldAlert, ArrowRight, PartyPopper, Shield, BookOpen, MessageCircle, FileText, User, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { PaymentDisclaimerModal } from '@/components/modals/PaymentDisclaimerModal';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';
import { normalize, getLineHeight } from '@/utils/responsive';
import { moderateScale, platformStyles } from '@/utils/scaling';

const logoImg = require('../assets/images/logo.png');

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  type?: string;
  created_at: string;
};

function getTypeConfig(type?: string) {
  switch (type) {
    case 'success':
      return { color: '#059669', label: 'Success', Icon: CheckCircle, bg: '#05966915' };
    case 'warning':
      return { color: '#D97706', label: 'Warning', Icon: AlertTriangle, bg: '#D9770615' };
    case 'error':
      return { color: '#DC2626', label: 'Urgent', Icon: AlertCircle, bg: '#DC262615' };
    case 'payment_declined':
      return { color: '#DC2626', label: 'Payment Issue', Icon: ShieldAlert, bg: '#DC262615' };
    case 'new_member':
      return { color: '#059669', label: 'Welcome', Icon: PartyPopper, bg: '#05966915' };
    default:
      return { color: colors.primary.main, label: 'Information', Icon: Info, bg: colors.primary.main + '12' };
  }
}

function getEndOfMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysRemaining() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    relative: getRelativeTime(d),
  };
}

function getRelativeTime(d: Date) {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return '';
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id: notificationId } = useLocalSearchParams<{ id?: string }>();

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.push('/notifications' as never);
    }
  };

  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { session } = useAuth();
  const { userData } = useUserData();
  const [notification, setNotification] = useState<NotificationRow | null>(null);
  const [loading, setLoading] = useState(!!notificationId);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showPaymentDisclaimer, setShowPaymentDisclaimer] = useState(false);
  const [advisor, setAdvisor] = useState<{ first_name: string; last_name: string; phone: string; email: string } | null>(null);

  useEffect(() => {
    if (!notificationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, created_at')
        .eq('id', notificationId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
        setNotification(null);
      } else {
        setNotification(data as NotificationRow | null);
        if (data && session?.user?.id) {
          supabase
            .from('notification_reads')
            .upsert(
              {
                notification_id: data.id,
                user_id: session.user.id,
                read_at: new Date().toISOString(),
              },
              { onConflict: 'notification_id,user_id' }
            )
            .then(() => {});
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [notificationId, session?.user?.id]);

  useEffect(() => {
    if (notification?.type !== 'new_member' || !userData?.agent_id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('advisors')
        .select('first_name, last_name, phone, email')
        .eq('agent_id', userData.agent_id)
        .maybeSingle();
      if (!cancelled && data) setAdvisor(data);
    })();
    return () => { cancelled = true; };
  }, [notification?.type, userData?.agent_id]);

  if (!notificationId) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={goBack} />
          <SmartText variant="h2" style={styles.headerTitle}>Notification</SmartText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <Bell size={moderateScale(48)} color={colors.gray[300]} />
          <Text style={styles.stateText}>Notification not found</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={goBack} />
          <SmartText variant="h2" style={styles.headerTitle}>Notification</SmartText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  if (fetchError || !notification) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={goBack} />
          <SmartText variant="h2" style={styles.headerTitle}>Notification</SmartText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <Text style={styles.stateText}>{fetchError ?? 'Notification not found'}</Text>
        </View>
      </View>
    );
  }

  const { color: typeColor, label: typeLabel, Icon: TypeIcon, bg: typeBg } = getTypeConfig(notification.type);
  const { date, time, relative } = formatDate(notification.created_at);
  const isPaymentDeclined = notification.type === 'payment_declined';
  const isNewMember = notification.type === 'new_member';
  const firstName = userData?.first_name || 'Member';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <BackButton onPress={goBack} />
        <SmartText variant="h2" style={styles.headerTitle}>Notification</SmartText>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollContentPaddingBottom + 20 }}
      >
        {isNewMember ? (
          /* ── New Member Welcome Template ── */
          <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
            <View style={[styles.accentBar, { backgroundColor: '#059669' }]} />

            {/* Welcome hero */}
            <View style={nmStyles.heroSection}>
              <View style={nmStyles.iconCircle}>
                <PartyPopper size={moderateScale(32)} color="#059669" strokeWidth={1.8} />
              </View>
            </View>

            <Text style={nmStyles.welcomeTitle}>Welcome to MPB Health! 🎉</Text>
            <Text style={nmStyles.welcomeSubtitle}>Hey {firstName}, we're so glad you're here!</Text>

            {/* Plan info card */}
            <View style={nmStyles.planCard}>
              <View style={nmStyles.planHeader}>
                <Shield size={moderateScale(20)} color={colors.primary.main} strokeWidth={2} />
                <Text style={nmStyles.planHeaderText}>Your Plan</Text>
              </View>
              <View style={nmStyles.planRowStacked}>
                <Text style={nmStyles.planLabel}>Plan Type</Text>
                <Text style={nmStyles.planValueWrap}>{userData?.product_label || 'N/A'}</Text>
              </View>
              <View style={nmStyles.planDivider} />
              <View style={nmStyles.planRowStacked}>
                <Text style={nmStyles.planLabel}>Benefit Level</Text>
                <Text style={nmStyles.planValueWrap}>{userData?.product_benefit || 'N/A'}</Text>
              </View>
            </View>

            {/* Agent info */}
            {advisor && (
              <View style={nmStyles.agentCard}>
                <View style={nmStyles.agentHeader}>
                  <View style={nmStyles.agentAvatar}>
                    <User size={moderateScale(22)} color={colors.primary.main} strokeWidth={2} />
                  </View>
                  <View style={nmStyles.agentHeaderText}>
                    <Text style={nmStyles.agentTitle}>Your Healthcare Advisor</Text>
                    <Text style={nmStyles.agentName}>{advisor.first_name} {advisor.last_name}</Text>
                  </View>
                </View>
                {advisor.phone ? (
                  <View style={nmStyles.agentContactRow}>
                    <Phone size={moderateScale(14)} color={colors.text.secondary} strokeWidth={2} />
                    <Text style={nmStyles.agentContactText}>{advisor.phone}</Text>
                  </View>
                ) : null}
                {advisor.email ? (
                  <View style={nmStyles.agentContactRow}>
                    <Mail size={moderateScale(14)} color={colors.text.secondary} strokeWidth={2} />
                    <Text style={nmStyles.agentContactText}>{advisor.email}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Getting started message */}
            <View style={nmStyles.messageContainer}>
              <Text style={nmStyles.messageText}>
                You're all set! 🙌 Here are a few things to help you get the most out of your membership:
              </Text>
            </View>

            {/* Quick actions */}
            <View style={nmStyles.actionsContainer}>
              <TouchableOpacity
                style={nmStyles.actionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/plan-details' as never)}
              >
                <View style={[nmStyles.actionIcon, { backgroundColor: colors.primary.main + '12' }]}>
                  <BookOpen size={moderateScale(20)} color={colors.primary.main} strokeWidth={2} />
                </View>
                <View style={nmStyles.actionTextBlock}>
                  <Text style={nmStyles.actionTitle}>📋 View Plan Details</Text>
                  <Text style={nmStyles.actionDesc}>See your coverage, benefits & membership handbook</Text>
                </View>
                <ChevronRight size={moderateScale(18)} color={colors.gray[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={nmStyles.actionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/chat' as never)}
              >
                <View style={[nmStyles.actionIcon, { backgroundColor: '#059669' + '12' }]}>
                  <MessageCircle size={moderateScale(20)} color="#059669" strokeWidth={2} />
                </View>
                <View style={nmStyles.actionTextBlock}>
                  <Text style={nmStyles.actionTitle}>💬 Chat with Concierge</Text>
                  <Text style={nmStyles.actionDesc}>Have questions? Our Concierge team is here 24/7</Text>
                </View>
                <ChevronRight size={moderateScale(18)} color={colors.gray[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={nmStyles.actionButton}
                activeOpacity={0.85}
                onPress={() => router.push('/member-services' as never)}
              >
                <View style={[nmStyles.actionIcon, { backgroundColor: '#7C3AED' + '12' }]}>
                  <FileText size={moderateScale(20)} color="#7C3AED" strokeWidth={2} />
                </View>
                <View style={nmStyles.actionTextBlock}>
                  <Text style={nmStyles.actionTitle}>📝 Member Forms</Text>
                  <Text style={nmStyles.actionDesc}>Update your information or make membership changes</Text>
                </View>
                <ChevronRight size={moderateScale(18)} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>

            {/* Welcome call prompt */}
            <View style={nmStyles.welcomeCallBox}>
              <Text style={nmStyles.welcomeCallTitle}>📞 Schedule Your Welcome Call</Text>
              <Text style={nmStyles.welcomeCallText}>
                Haven't scheduled your welcome call yet? It's a quick call to walk you through all your benefits so you know exactly how to use them.
              </Text>
              <TouchableOpacity
                style={nmStyles.welcomeCallButton}
                activeOpacity={0.85}
                onPress={() => router.push('/member-services' as never)}
              >
                <Text style={nmStyles.welcomeCallButtonText}>Schedule Now</Text>
                <ArrowRight size={moderateScale(16)} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Closing message */}
            <View style={nmStyles.closingBox}>
              <Text style={nmStyles.closingText}>
                💙 We're here to make your healthcare journey simple and stress-free. Don't hesitate to reach out if you need anything!
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerTop}>
                <Image source={logoImg} style={styles.footerLogo} resizeMode="contain" />
              </View>
              <View style={styles.timestampRow}>
                <View style={styles.timestampItem}>
                  <Calendar size={moderateScale(14)} color={colors.text.disabled} strokeWidth={2} />
                  <Text style={styles.timestampText}>{date}</Text>
                </View>
                <View style={styles.timestampItem}>
                  <Clock size={moderateScale(14)} color={colors.text.disabled} strokeWidth={2} />
                  <Text style={styles.timestampText}>{time}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : isPaymentDeclined ? (
          /* ── Payment Declined Special Template ── */
          <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
            <View style={[styles.accentBar, { backgroundColor: '#DC2626' }]} />

            {/* Alert icon hero */}
            <View style={pdStyles.heroSection}>
              <View style={pdStyles.iconCircle}>
                <CreditCard size={moderateScale(32)} color="#DC2626" strokeWidth={1.8} />
              </View>
            </View>

            {/* Heading */}
            <Text style={pdStyles.greeting}>Payment Method Declined 💳</Text>

            {/* Main message */}
            <View style={pdStyles.messageContainer}>
              <Text style={pdStyles.messageText}>
                We were unable to process your most recent payment. Your payment method on file has been{' '}
                <Text style={pdStyles.declinedText}>declined</Text>.
              </Text>

              <Text style={pdStyles.messageText}>
                To avoid any disruption to your coverage and benefits, please update your payment information immediately.
              </Text>
            </View>

            {/* Due date warning box */}
            <View style={pdStyles.dueDateBox}>
              <View style={pdStyles.dueDateHeader}>
                <AlertTriangle size={moderateScale(18)} color="#D97706" strokeWidth={2.5} />
                <Text style={pdStyles.dueDateTitle}>⚠️ Action Required</Text>
              </View>
              <Text style={pdStyles.dueDateText}>
                Deadline to update:{' '}
                <Text style={pdStyles.dueDateHighlight}>{getEndOfMonth()}</Text>
              </Text>
              <Text style={pdStyles.daysLeftText}>
                Only{' '}
                <Text style={pdStyles.daysLeftCount}>{getDaysRemaining()} days remaining</Text>
              </Text>
            </View>

            {/* Consequences warning */}
            <View style={pdStyles.warningBox}>
              <Text style={pdStyles.warningText}>
                🚨 If payment is not updated by the deadline, your plan will be{' '}
                <Text style={pdStyles.cancelledText}>automatically cancelled</Text> and you will{' '}
                <Text style={pdStyles.cancelledText}>permanently lose access to all your benefits</Text>, including medical, telehealth, and prescription coverage.
              </Text>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={pdStyles.ctaButton}
              activeOpacity={0.85}
              onPress={() => setShowPaymentDisclaimer(true)}
            >
              <CreditCard size={moderateScale(20)} color="#FFFFFF" strokeWidth={2} />
              <Text style={pdStyles.ctaButtonText}>Update Payment Method</Text>
              <ArrowRight size={moderateScale(18)} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Concierge CTA */}
            <TouchableOpacity
              style={pdStyles.conciergeButton}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <Text style={pdStyles.conciergeButtonText}>
                💙 Need help? Chat with our Concierge — we're always here for you!
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerTop}>
                <Image source={logoImg} style={styles.footerLogo} resizeMode="contain" />
              </View>
              <View style={styles.timestampRow}>
                <View style={styles.timestampItem}>
                  <Calendar size={moderateScale(14)} color={colors.text.disabled} strokeWidth={2} />
                  <Text style={styles.timestampText}>{date}</Text>
                </View>
                <View style={styles.timestampItem}>
                  <Clock size={moderateScale(14)} color={colors.text.disabled} strokeWidth={2} />
                  <Text style={styles.timestampText}>{time}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : (
          /* ── Default Notification Card ── */
          <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
            <View style={[styles.accentBar, { backgroundColor: typeColor }]} />

            <View style={styles.metaRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
                <TypeIcon size={moderateScale(14)} color={typeColor} strokeWidth={2.5} />
                <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
              </View>
              {relative ? (
                <Text style={styles.relativeTime}>{relative}</Text>
              ) : null}
            </View>

            <Text style={styles.title}>{notification.title}</Text>

            <View style={styles.divider} />

            <Text style={styles.body}>{notification.body}</Text>

            <View style={styles.footer}>
              <View style={styles.footerTop}>
                <Image source={logoImg} style={styles.footerLogo} resizeMode="contain" />
              </View>
              <View style={styles.timestampRow}>
                <View style={styles.timestampItem}>
                  <Calendar size={moderateScale(14)} color={colors.text.disabled} strokeWidth={2} />
                  <Text style={styles.timestampText}>{date}</Text>
                </View>
                <View style={styles.timestampItem}>
                  <Clock size={moderateScale(14)} color={colors.text.disabled} strokeWidth={2} />
                  <Text style={styles.timestampText}>{time}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <PaymentDisclaimerModal
        visible={showPaymentDisclaimer}
        onClose={() => setShowPaymentDisclaimer(false)}
        onContinue={() => {
          setShowPaymentDisclaimer(false);
          router.push('/payment-history' as never);
        }}
        onContactConcierge={() => router.push('/chatWithConcierge' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.subtle ?? colors.gray[50],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: moderateScale(40),
  },

  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  stateText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  scroll: {
    flex: 1,
  },

  card: {
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.default,
    overflow: 'hidden',
    ...shadows.md,
  },

  accentBar: {
    height: 4,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  typeBadgeText: {
    fontSize: normalize(12),
    fontWeight: '600',
  },

  relativeTime: {
    ...typography.caption,
    color: colors.text.disabled,
    fontWeight: '500',
  },

  title: {
    ...typography.h2,
    color: colors.text.primary,
    lineHeight: getLineHeight(normalize(22), 1.35),
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },

  body: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: getLineHeight(normalize(16), 1.8),
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  footer: {
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  footerTop: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  footerLogo: {
    width: moderateScale(90),
    height: moderateScale(24),
    opacity: 0.4,
  },

  timestampRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  timestampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timestampText: {
    ...typography.caption,
    color: colors.text.disabled,
  },
});

const pdStyles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  iconCircle: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: '#DC262612',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC262620',
  },
  greeting: {
    fontSize: normalize(22),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  messageContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  messageText: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: getLineHeight(normalize(16), 1.75),
  },
  declinedText: {
    color: '#DC2626',
    fontWeight: '700',
  },

  dueDateBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dueDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dueDateTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: '#92400E',
  },
  dueDateText: {
    ...typography.body1,
    color: '#78350F',
    lineHeight: getLineHeight(normalize(15), 1.6),
  },
  dueDateHighlight: {
    fontWeight: '800',
    color: '#92400E',
  },
  daysLeftText: {
    ...typography.body1,
    color: '#78350F',
    marginTop: spacing.xs,
    lineHeight: getLineHeight(normalize(15), 1.6),
  },
  daysLeftCount: {
    fontWeight: '800',
    color: '#DC2626',
  },

  warningBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    ...typography.body2,
    color: '#991B1B',
    lineHeight: getLineHeight(normalize(14), 1.7),
  },
  cancelledText: {
    fontWeight: '700',
    color: '#DC2626',
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  ctaButtonText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  conciergeButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.main + '0A',
    borderWidth: 1,
    borderColor: colors.primary.main + '20',
  },
  conciergeButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    textAlign: 'center',
    lineHeight: getLineHeight(normalize(14), 1.6),
    fontWeight: '600',
  },
});

const nmStyles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  iconCircle: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: '#05966912',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#05966920',
  },

  welcomeTitle: {
    fontSize: normalize(22),
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  welcomeSubtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },

  planCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.primary.main + '08',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.main + '18',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  planHeaderText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.primary.main,
  },
  planRowStacked: {
    paddingVertical: spacing.xs,
  },
  planLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  planValueWrap: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '700',
  },
  planDivider: {
    height: 1,
    backgroundColor: colors.primary.main + '15',
    marginVertical: spacing.xs,
  },

  agentCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  agentAvatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.primary.main + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentHeaderText: {
    flex: 1,
  },
  agentTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agentName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  agentContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  agentContactText: {
    ...typography.body2,
    color: colors.text.secondary,
  },

  messageContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  messageText: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: getLineHeight(normalize(16), 1.75),
  },

  actionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    gap: spacing.sm,
  },
  actionIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTextBlock: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: getLineHeight(normalize(12), 1.4),
  },

  welcomeCallBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  welcomeCallTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: spacing.sm,
  },
  welcomeCallText: {
    ...typography.body2,
    color: '#1E3A5F',
    lineHeight: getLineHeight(normalize(14), 1.6),
  },
  welcomeCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  welcomeCallButtonText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  closingBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: '#059669' + '0A',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#059669' + '18',
  },
  closingText: {
    ...typography.body2,
    color: '#065F46',
    textAlign: 'center',
    lineHeight: getLineHeight(normalize(14), 1.6),
    fontWeight: '500',
  },
});
