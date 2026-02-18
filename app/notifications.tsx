import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, AlertCircle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { EmptyState } from '@/components/common/EmptyState';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { useResponsive } from '@/hooks/useResponsive';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  route?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Welcome to MPB Health App',
      message:
        "Thank you for joining MPB Health. We're excited to help you on your healthcare journey.",
      date: new Date().toISOString(),
      read: false,
      route: '/notification-detail',
      type: 'success',
    },
  ]);

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

  const getColor = (type?: string) => {
    switch (type) {
      case 'success':
        return colors.status.success;
      case 'warning':
        return colors.status.warning;
      case 'error':
        return colors.status.error;
      default:
        return colors.primary.main;
    }
  };

  const onPress = (n: Notification) => {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    n.route && router.push(n.route as any);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Notifications</SmartText>
      </Animated.View>

      <ScrollView
        overScrollMode="never"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          {notifications.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(200)}>
              <EmptyState
                icon={<Bell size={moderateScale(48)} color={colors.gray[300]} />}
                message="No Notifications"
                subtitle="You don't have any notifications at the moment."
              />
            </Animated.View>
          ) : (
            <View style={styles.list}>
              {notifications.map((n, i) => {
                const accent = getColor(n.type);
                const bgColor = accent + '15';
                return (
                  <Animated.View
                    key={n.id}
                    entering={FadeInUp.delay(200 + i * 100)}
                    style={styles.cardWrapper}
                  >
                    <Pressable
                      onPress={() => onPress(n)}
                      style={[
                        styles.card,
                        !n.read && { backgroundColor: colors.primary.main + '08' },
                      ]}
                    >
                      <View style={[styles.icon, { backgroundColor: bgColor }]}>
                        <AlertCircle size={moderateScale(22)} color={accent} />
                      </View>

                      <View style={styles.textBlock}>
                        <View style={styles.line}>
                          <SmartText variant="body1" style={styles.cardTitle}>{n.title}</SmartText>
                          {!n.read && <View style={[styles.dot, { backgroundColor: accent }]} />}
                        </View>
                        <SmartText variant="body2" style={styles.cardMsg}>
                          {n.message}
                        </SmartText>
                        <SmartText variant="caption" style={styles.cardDate}>{formatDate(n.date)}</SmartText>
                      </View>

                      {n.route && <ChevronRight size={moderateScale(18)} color={colors.gray[400]} />}
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
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },

  header: {
    backgroundColor: colors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSize.md,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },

  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
    flex: 1,
    minWidth: 0,
  },

  scrollContent: {
    padding: responsiveSize.md,
    paddingBottom: responsiveSize.xl,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  list: {
    gap: responsiveSize.md,
  },

  cardWrapper: {
    width: '100%',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: responsiveSize.md,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },

  icon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },

  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },

  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
  },

  cardTitle: {
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },

  dot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: borderRadius.full,
    flexShrink: 0,
  },

  cardMsg: {
    color: colors.text.secondary,
  },

  cardDate: {
    color: colors.text.secondary,
  },
});
