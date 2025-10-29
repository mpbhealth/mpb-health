import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  Linking,
  useWindowDimensions,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  MessageSquare,
  Clock,
  Phone,
  Mail,
  ArrowRight,
  Copy,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// static local logo (adjust relative path if this file moves)
const logoImg = require('../../assets/images/logo.png');

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  // ✅ Updated business hours for Concierge
  const conciergeHours = [
    { day: 'Mon – Fri', hours: '9:00 AM – 5:00 PM EST' },
    { day: 'Sat – Sun', hours: 'Closed' },
  ];

  // ☎️ Telehealth uses this number 24/7 (Option 2)
  const phoneNumber = '+1 800 519 2969';
  const telprompt = `telprompt:${phoneNumber}`;
  const tel = `tel:${phoneNumber}`;
  const mailto = 'mailto:concierge@mympb.com';

  const [canCall, setCanCall] = useState(true);
  const [canEmail, setCanEmail] = useState(true);

  useEffect(() => {
    (async () => {
      const callOk = (await Linking.canOpenURL(telprompt)) || (await Linking.canOpenURL(tel));
      const emailOk = await Linking.canOpenURL(mailto);
      setCanCall(callOk);
      setCanEmail(emailOk);
    })();
  }, []);

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'web') {
      alert('Copied to clipboard: ' + text);
    } else {
      Alert.alert('Copied to clipboard', text);
    }
  };

  const handleCall = async () => {
    try {
      if (await Linking.canOpenURL(telprompt)) await Linking.openURL(telprompt);
      else if (await Linking.canOpenURL(tel)) await Linking.openURL(tel);
      else throw new Error();
    } catch {
      if (Platform.OS === 'web') {
        alert('Call failed. Tap the copy icon to copy the number.');
      } else {
        Alert.alert('Call failed', 'Tap the copy icon to copy the number.');
      }
    }
  };

  const handleEmail = async () => {
    try {
      if (await Linking.canOpenURL(mailto)) await Linking.openURL(mailto);
      else throw new Error();
    } catch {
      if (Platform.OS === 'web') {
        alert('Email failed. Tap the copy icon to copy the address.');
      } else {
        Alert.alert('Email failed', 'Tap the copy icon to copy the address.');
      }
    }
  };

  // 🔓 Chat is always available in the app (we just display concierge hours separately)
  const goChat = () => {
    router.push('/chatWithConcierge' as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'ios' ? insets.top + spacing.lg : spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* — Welcome */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.welcome}>
          <Image source={logoImg} style={styles.logo} />
          <Text style={styles.title}>Health Concierge</Text>
          <Text style={styles.subtitle}>
            Get personalized support for all your healthcare questions and needs.
          </Text>
        </Animated.View>

        {/* — Divider */}
        <View style={styles.divider} />

        {/* — Support Hours (concierge + telehealth note) */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <Clock size={20} color={colors.primary.main} />
            <Text style={styles.hoursTitle}>Support Hours</Text>
          </View>

          {/* Concierge hours */}
          <Text style={styles.sectionLabel}>Concierge</Text>
          {conciergeHours.map((s, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(300 + 100 * i)}
              layout={Layout.springify()}
              style={[styles.hourRow, i === conciergeHours.length - 1 && styles.lastHourRow]}
            >
              <Text style={styles.hourDay}>{s.day}</Text>
              <Text style={[styles.hourTime, s.hours === 'Closed' && styles.hourClosed]}>
                {s.hours}
              </Text>
            </Animated.View>
          ))}

          {/* Telehealth 24/7 note explicitly pointing to Option 2 */}
          <View style={[styles.telehealthNote, styles.hourRow]}>
            <Text style={styles.hourDay}>Telehealth Support</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>24/7</Text>
            </View>
          </View>
          <Text style={styles.noteText}>
            For Telehealth Support, Select <Text style={styles.noteStrong}>Option 2</Text> When calling <Text style={styles.noteStrong}>Concierge number</Text>.
          </Text>
        </Animated.View>

        <View style={styles.divider} />

        {/* — Actions */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.actions, isWide && styles.actionsWide]}>
          {/* Chat */}
          <AnimatedTouchable
            entering={FadeInUp.delay(500)}
            layout={Layout.springify()}
            style={[styles.actionButton, styles.chatBtn, isWide && styles.flexOne]}
            onPress={goChat}
            activeOpacity={0.85}
          >
            <View style={styles.actionInner}>
              <MessageSquare size={24} color="#fff" />
              <Text style={styles.chatText}>Start Chat</Text>
              <ArrowRight size={20} color="#fff" />
            </View>
          </AnimatedTouchable>

          {/* Call Concierge */}
          <AnimatedTouchable
            entering={FadeInUp.delay(600)}
            layout={Layout.springify()}
            style={[styles.actionButton, isWide && styles.flexOne]}
            onPress={handleCall}
          >
            <View style={styles.iconBox}>
              <Phone size={20} color={colors.primary.main} />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.contactLabel}>Call Concierge</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactValue}>{phoneNumber}</Text>
                {!canCall && (
                  <TouchableOpacity onPress={() => copy(phoneNumber)} style={styles.copyBtn}>
                    <Copy size={14} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </AnimatedTouchable>

          {/* Email (Concierge) */}
          <AnimatedTouchable
            entering={FadeInUp.delay(700)}
            layout={Layout.springify()}
            style={[styles.actionButton, isWide && styles.flexOne]}
            onPress={handleEmail}
          >
            <View style={styles.iconBox}>
              <Mail size={20} color={colors.primary.main} />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.contactLabel}>Email Concierge</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactValue}>concierge@mympb.com</Text>
                {!canEmail && (
                  <TouchableOpacity onPress={() => copy('concierge@mympb.com')} style={styles.copyBtn}>
                    <Copy size={14} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </AnimatedTouchable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // container + scroll
  container: { flex: 1, backgroundColor: colors.background.paper },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  // welcome card
  welcome: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.md,
    marginBottom: spacing.md,
  },
  logo: { width: 200, height: 50, marginBottom: spacing.xl, resizeMode: 'contain' as const },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700' as const,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body1,
    textAlign: 'center',
    color: colors.text.secondary,
    maxWidth: 400,
    lineHeight: 24,
  },

  // section divider
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.lg,
  },

  // support hours
  hoursCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  hoursHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  hoursTitle: {
    ...typography.h4,
    marginLeft: spacing.sm,
    color: colors.text.primary,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  lastHourRow: { borderBottomWidth: 0 },
  hourDay: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hourTime: {
    ...typography.body1,
    color: colors.primary.main,
  },
  hourClosed: { color: colors.status.error },

  telehealthNote: {
    alignItems: 'center',
  },
  noteText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  noteStrong: { fontWeight: '700', color: colors.text.primary },

  // actions container
  actions: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  actionsWide: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexOne: { flex: 1 },

  // shared button styles
  actionButton: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },

  // chat button
  chatBtn: {
    backgroundColor: colors.primary.main,
    ...shadows.lg,
  },
  actionInner: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatText: {
    ...typography.h4,
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: spacing.sm,
  },

  // phone/email icons & text
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textBox: { flex: 1 },

  contactLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  },
  contactLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    backgroundColor: `${colors.primary.main}12`,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '700',
  },

  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    backgroundColor: `${colors.primary.main}12`,
  },
  badgeTextSmall: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '700',
  },

  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactValue: {
    ...typography.body1,
    color: colors.primary.main,
    fontWeight: '500',
  },
  copyBtn: { marginLeft: spacing.sm, padding: spacing.xs },
});
