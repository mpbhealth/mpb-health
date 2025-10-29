// src/screens/NotificationsScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, AlertCircle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ANDROID = Platform.OS === 'android';

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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'ios' ? insets.top + spacing.sm : spacing.lg },
          !ANDROID && shadows.sm, // iOS soft shadow only
        ]}
      >
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Notifications</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyState}>
            <Bell size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You don't have any notifications at the moment.</Text>
          </Animated.View>
        ) : (
          <View style={[styles.list, isTablet && styles.tabletList]}>
            {notifications.map((n, i) => {
              const accent = getColor(n.type);
              const bgColor = accent + '15';
              return (
                <Animated.View
                  key={n.id}
                  entering={FadeInUp.delay(200 + i * 100)}
                  style={[styles.cardWrapper, isTablet && (i % 2 === 0 ? { marginRight: spacing.md } : {})]}
                >
                  <Pressable
                    onPress={() => onPress(n)}
                    style={[
                      styles.card,
                      ANDROID && styles.cardSurface, // remove Android shadow halo
                      !ANDROID && shadows.sm,        // keep iOS shadow
                      !n.read && { backgroundColor: colors.primary.main + '08' },
                    ]}
                  >
                    <View style={[styles.icon, { backgroundColor: bgColor }]}>
                      <AlertCircle size={24} color={accent} />
                    </View>

                    <View style={styles.textBlock}>
                      <View style={styles.line}>
                        <Text style={styles.cardTitle}>{n.title}</Text>
                        {!n.read && <View style={[styles.dot, { backgroundColor: accent }]} />}
                      </View>
                      <Text style={styles.cardMsg} numberOfLines={2}>
                        {n.message}
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(n.date)}</Text>
                    </View>

                    {n.route && <ChevronRight size={20} color={colors.gray[400]} />}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// tiny util to mimic iOS elevation with a hairline border on Android
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },

  header: {
    backgroundColor: colors.background.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: Platform.OS === 'android' ? colors.gray[100] : 'transparent',
  },

  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },

  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  tabletScrollContent: { maxWidth: 900, alignSelf: 'center' },

  emptyState: { marginTop: spacing.xxl, alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: { ...typography.h3, marginTop: spacing.lg, color: colors.text.primary },
  emptyText: { ...typography.body1, marginTop: spacing.xs, color: colors.text.secondary, textAlign: 'center' },

  list: { flexDirection: 'column' },
  tabletList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  cardWrapper: { marginBottom: spacing.md, width: '100%' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },

  // Android surface replacement for shadows
  cardSurface: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[100],
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },

  textBlock: { flex: 1 },

  line: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },

  cardTitle: { ...typography.h4, color: colors.text.primary, flex: 1 },

  dot: { width: 8, height: 8, borderRadius: borderRadius.full, marginLeft: spacing.sm },

  cardMsg: { ...typography.body1, color: colors.text.secondary, lineHeight: 20, marginBottom: spacing.xs },

  cardDate: { ...typography.caption, color: colors.text.secondary },
});
