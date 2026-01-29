import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
  Linking,
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
import { colors, borderRadius } from '@/constants/theme';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const logoImg = require('../../assets/images/logo.png');

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  const conciergeHours = [
    { day: 'Mon – Fri', hours: '9:00 AM – 5:00 PM EST' },
    { day: 'Sat – Sun', hours: 'Closed' },
  ];

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
            paddingTop: Platform.OS === 'ios' ? insets.top + responsiveSize.lg : responsiveSize.xl,
            paddingBottom: insets.bottom + responsiveSize.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Card padding="lg" variant="elevated" style={styles.welcomeCard}>
              <Image source={logoImg} style={styles.logo} resizeMode="contain" />
              <SmartText variant="h2" style={styles.title}>
                Health Concierge
              </SmartText>
              <SmartText variant="body1" style={styles.subtitle}>
                Get personalized support for all your healthcare questions and needs.
              </SmartText>
            </Card>
          </Animated.View>

          <View style={styles.divider} />

          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" variant="elevated" style={styles.hoursCard}>
              <View style={styles.hoursHeader}>
                <Clock size={moderateScale(20)} color={colors.primary.main} />
                <SmartText variant="h4" style={styles.hoursTitle}>
                  Support Hours
                </SmartText>
              </View>

              <SmartText variant="caption" style={styles.sectionLabel}>
                Concierge
              </SmartText>
              {conciergeHours.map((s, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInUp.delay(300 + 100 * i)}
                  layout={Layout.springify()}
                  style={[styles.hourRow, i === conciergeHours.length - 1 && styles.lastHourRow]}
                >
                  <SmartText variant="body1" style={styles.hourDay}>
                    {s.day}
                  </SmartText>
                  <SmartText
                    variant="body1"
                    style={[styles.hourTime, s.hours === 'Closed' && styles.hourClosed]}
                  >
                    {s.hours}
                  </SmartText>
                </Animated.View>
              ))}

              <View style={[styles.telehealthNote, styles.hourRow]}>
                <SmartText variant="body1" style={styles.hourDay}>
                  Telehealth Support
                </SmartText>
                <View style={styles.badge}>
                  <SmartText variant="caption" style={styles.badgeText}>
                    24/7
                  </SmartText>
                </View>
              </View>
              <SmartText variant="caption" style={styles.noteText}>
                For Telehealth Support, Select <SmartText variant="caption" style={styles.noteStrong}>Option 2</SmartText> When calling <SmartText variant="caption" style={styles.noteStrong}>Concierge number</SmartText>.
              </SmartText>
            </Card>
          </Animated.View>

          <View style={styles.divider} />

          <Animated.View entering={FadeInUp.delay(400)} style={[styles.actions, isTablet && styles.actionsWide]}>
            <AnimatedTouchable
              entering={FadeInUp.delay(500)}
              layout={Layout.springify()}
              style={[styles.actionButton, styles.chatBtn, isTablet && styles.flexOne]}
              onPress={goChat}
              activeOpacity={0.85}
            >
              <View style={styles.actionInner}>
                <MessageSquare size={moderateScale(24)} color="#fff" />
                <SmartText variant="h4" style={styles.chatText}>
                  Start Chat
                </SmartText>
                <ArrowRight size={moderateScale(20)} color="#fff" />
              </View>
            </AnimatedTouchable>

            <AnimatedTouchable
              entering={FadeInUp.delay(600)}
              layout={Layout.springify()}
              style={[styles.actionButton, isTablet && styles.flexOne]}
              onPress={handleCall}
            >
              <View style={styles.iconBox}>
                <Phone size={moderateScale(20)} color={colors.primary.main} />
              </View>
              <View style={styles.textBox}>
                <SmartText variant="caption" style={styles.contactLabel}>
                  Call Concierge
                </SmartText>
                <View style={styles.contactRow}>
                  <SmartText variant="body1" style={styles.contactValue} maxLines={1}>
                    {phoneNumber}
                  </SmartText>
                  {!canCall && (
                    <TouchableOpacity onPress={() => copy(phoneNumber)} style={styles.copyBtn}>
                      <Copy size={moderateScale(14)} color={colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </AnimatedTouchable>

            <AnimatedTouchable
              entering={FadeInUp.delay(700)}
              layout={Layout.springify()}
              style={[styles.actionButton, isTablet && styles.flexOne]}
              onPress={handleEmail}
            >
              <View style={styles.iconBox}>
                <Mail size={moderateScale(20)} color={colors.primary.main} />
              </View>
              <View style={styles.textBox}>
                <SmartText variant="caption" style={styles.contactLabel}>
                  Email Concierge
                </SmartText>
                <View style={styles.contactRow}>
                  <SmartText variant="body1" style={styles.contactValue} maxLines={1}>
                    concierge@mympb.com
                  </SmartText>
                  {!canEmail && (
                    <TouchableOpacity onPress={() => copy('concierge@mympb.com')} style={styles.copyBtn}>
                      <Copy size={moderateScale(14)} color={colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </AnimatedTouchable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingHorizontal: responsiveSize.lg,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  welcomeCard: {
    alignItems: 'center',
    marginBottom: responsiveSize.md,
  },
  logo: {
    width: moderateScale(200),
    height: moderateScale(50),
    marginBottom: responsiveSize.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: responsiveSize.sm,
    color: colors.text.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.text.secondary,
    maxWidth: moderateScale(400),
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: responsiveSize.lg,
  },

  hoursCard: {
    marginBottom: responsiveSize.md,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.md,
    gap: responsiveSize.sm,
  },
  hoursTitle: {
    color: colors.text.primary,
    flex: 1,
  },
  sectionLabel: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xs,
    marginTop: responsiveSize.xs,
    textTransform: 'uppercase',
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: responsiveSize.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: responsiveSize.sm,
  },
  lastHourRow: {
    borderBottomWidth: 0
  },
  hourDay: {
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  hourTime: {
    color: colors.primary.main,
    textAlign: 'right',
  },
  hourClosed: {
    color: colors.status.error
  },

  telehealthNote: {
    alignItems: 'center',
  },
  noteText: {
    color: colors.text.secondary,
    marginTop: responsiveSize.xs,
  },
  noteStrong: {
    fontWeight: '700',
    color: colors.text.primary
  },

  actions: {
    flexDirection: 'column',
    gap: responsiveSize.md,
  },
  actionsWide: {
    flexDirection: 'row',
  },
  flexOne: {
    flex: 1
  },

  actionButton: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },

  chatBtn: {
    backgroundColor: colors.primary.main,
    ...platformStyles.shadow,
  },
  actionInner: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatText: {
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: responsiveSize.sm,
    flex: 1,
  },

  iconBox: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.md,
    flexShrink: 0,
  },
  textBox: {
    flex: 1,
    minWidth: 0,
  },

  contactLabel: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xs / 2,
    textTransform: 'uppercase',
  },

  badge: {
    paddingHorizontal: responsiveSize.sm,
    paddingVertical: responsiveSize.xs / 2,
    borderRadius: 999,
    backgroundColor: `${colors.primary.main}12`,
  },
  badgeText: {
    color: colors.primary.main,
    fontWeight: '700',
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
  },
  contactValue: {
    color: colors.primary.main,
    fontWeight: '500',
    flex: 1,
  },
  copyBtn: {
    padding: responsiveSize.xs,
    flexShrink: 0,
    minWidth: MIN_TOUCH_TARGET / 2,
    minHeight: MIN_TOUCH_TARGET / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
