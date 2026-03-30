import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Bell, ChevronRight, Info, CheckCircle, AlertTriangle, AlertCircle, ShieldAlert, PartyPopper } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { EmptyState } from '@/components/common/EmptyState';
import { colors, borderRadius, typography, spacing } from '@/constants/theme';
import { moderateScale, MIN_TOUCH_TARGET, cardChromeSm, platformStyles } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();
  const { notifications, loading, error, refetch, markAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - date.getTime()) / 1000 / 60 / 60);
    if (diffH < 24) {
      if (diffH < 1) {
        const diffM = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
        return `${diffM} min${diffM !== 1 ? 's' : ''} ago`;
      }
      return `${diffH} hr${diffH !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeStyle = (type?: string): { color: string; Icon: typeof Info } => {
    switch (type) {
      case 'success':
        return { color: colors.status.success, Icon: CheckCircle };
      case 'warning':
        return { color: colors.status.warning, Icon: AlertTriangle };
      case 'error':
        return { color: colors.status.error, Icon: AlertCircle };
      case 'payment_declined':
        return { color: '#DC2626', Icon: ShieldAlert };
      case 'new_member':
        return { color: '#059669', Icon: PartyPopper };
      default:
        return { color: colors.primary.main, Icon: Info };
    }
  };

  const isPaymentDeclined = (type?: string) => type === 'payment_declined';

  const onPress = (n: AppNotification) => {
    markAsRead(n.id);
    router.push(`/notification-detail?id=${n.id}` as never);
  };

  if (loading) {
    return (
      <View style={screenChrome.container}>
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[styles.header, { paddingTop: headerPaddingTop }]}
        >
          <BackButton onPress={goBack} />
          <View style={styles.headerTextBlock}>
            <SmartText variant="h2" style={styles.title}>Notifications</SmartText>
            <Text style={styles.subtitle}>Loading…</Text>
          </View>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={screenChrome.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <BackButton onPress={goBack} />
        <View style={styles.headerTextBlock}>
          <SmartText variant="h2" style={styles.title}>Notifications</SmartText>
          <Text style={styles.subtitle}>
            {notifications.length === 0
              ? 'No messages'
              : `${notifications.length} message${notifications.length !== 1 ? 's' : ''}${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        overScrollMode="never"
        contentContainerStyle={[screenChrome.scrollContent, styles.scrollContentExtra, { paddingBottom: scrollContentPaddingBottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          {error ? (
            <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyWrapper}>
              <EmptyState
                icon={<AlertCircle size={moderateScale(48)} color={colors.status.error} />}
                message="Something went wrong"
                subtitle={error}
                actionLabel="Retry"
                onAction={refetch}
              />
            </Animated.View>
          ) : notifications.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyWrapper}>
              <EmptyState
                icon={<Bell size={moderateScale(48)} color={colors.gray[300]} />}
                message="No Notifications"
                subtitle="You don't have any notifications at the moment."
              />
            </Animated.View>
          ) : (
            <View style={styles.list}>
              {notifications.map((n, i) => {
                const { color: accent, Icon } = getTypeStyle(n.type);
                const bgColor = accent + '12';
                const urgent = isPaymentDeclined(n.type);
                const welcome = n.type === 'new_member';
                return (
                  <Animated.View
                    key={n.id}
                    entering={FadeInUp.delay(200 + i * 80)}
                    style={styles.cardWrapper}
                  >
                    <Pressable
                      onPress={() => onPress(n)}
                      style={({ pressed }) => [
                        styles.card,
                        !n.read && styles.cardUnread,
                        urgent && styles.cardUrgent,
                        welcome && styles.cardWelcome,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={[styles.accentBar, { backgroundColor: accent }, urgent && styles.accentBarUrgent]} />
                      <View style={[styles.iconWrap, { backgroundColor: bgColor }, urgent && styles.iconWrapUrgent, welcome && styles.iconWrapWelcome]}>
                        <Icon size={moderateScale(22)} color={urgent ? '#FFFFFF' : welcome ? '#FFFFFF' : accent} strokeWidth={2} />
                      </View>
                      <View style={styles.textBlock}>
                        {urgent && (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentBadgeText}>🚨 ACTION REQUIRED</Text>
                          </View>
                        )}
                        {welcome && (
                          <View style={styles.welcomeBadge}>
                            <Text style={styles.welcomeBadgeText}>🎉 WELCOME</Text>
                          </View>
                        )}
                        <View style={styles.line}>
                          <SmartText variant="body1" style={[styles.cardTitle, urgent && styles.cardTitleUrgent, welcome && styles.cardTitleWelcome]}>
                            {n.title}
                          </SmartText>
                          {!n.read && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
                        </View>
                        <SmartText variant="body2" style={[styles.cardMsg, urgent && styles.cardMsgUrgent]}>
                          {n.message}
                        </SmartText>
                        <Text style={styles.cardDate}>{formatDate(n.date)}</Text>
                      </View>
                      <View style={styles.chevronWrap}>
                        <ChevronRight size={moderateScale(20)} color={urgent ? '#DC2626' : welcome ? '#059669' : colors.gray[400]} />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  scrollContentExtra: {
    paddingBottom: spacing.xxl * 3,
  },
  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 720,
  },
  emptyWrapper: {
    paddingVertical: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    minHeight: MIN_TOUCH_TARGET,
    overflow: 'hidden',
    ...cardChromeSm,
  },
  cardUnread: {
    backgroundColor: colors.primary.main + '06',
  },
  cardUrgent: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cardWelcome: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cardPressed: {
    opacity: 0.92,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  accentBarUrgent: {
    width: 5,
  },
  iconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    flexShrink: 0,
  },
  iconWrapUrgent: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(22),
  },
  iconWrapWelcome: {
    backgroundColor: '#059669',
    borderRadius: moderateScale(22),
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    gap: 4,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  cardTitleUrgent: {
    color: '#991B1B',
    fontWeight: '700',
  },
  cardTitleWelcome: {
    color: '#065F46',
    fontWeight: '700',
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: 2,
  },
  urgentBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: 2,
  },
  welcomeBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },
  cardMsg: {
    color: colors.text.secondary,
    flexShrink: 1,
  },
  cardMsgUrgent: {
    color: '#7F1D1D',
  },
  cardDate: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  chevronWrap: {
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
