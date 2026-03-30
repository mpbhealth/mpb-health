import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Linking,
  Alert,
  useWindowDimensions,
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
import { useTabScreenSafePadding } from '@/hooks/useSafeHeaderPadding';
import { colors, borderRadius } from '@/constants/theme';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles, cardChromeSm } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

export default function ChatScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useTabScreenSafePadding();
  const { width: screenWidth } = useWindowDimensions();
  const { isTablet } = useResponsive();

  const contentPaddingHorizontal = useMemo(
    () => (screenWidth <= 320 ? moderateScale(14) : moderateScale(20)),
    [screenWidth]
  );

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
      <Animated.View
        entering={FadeInDown.delay(80)}
        style={[
          styles.header,
          { paddingTop: headerPaddingTop, paddingHorizontal: contentPaddingHorizontal },
        ]}
      >
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <SmartText variant="overline" style={styles.headerOverline}>
            Support
          </SmartText>
          <SmartText variant="h2" style={styles.headerTitle}>
            Health Concierge
          </SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        overScrollMode="never"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: contentPaddingHorizontal,
            paddingBottom: scrollContentPaddingBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(120)}>
            <SmartText variant="body1" style={styles.intro}>
              Get personalized support for all your healthcare questions and needs.
            </SmartText>
          </Animated.View>

          <View style={styles.sectionSpacer} />

          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" variant="elevated" style={styles.hoursCard}>
              <View style={styles.hoursHeader}>
                <View style={styles.hoursHeaderIcon}>
                  <Clock size={moderateScale(20)} color={colors.primary.main} />
                </View>
                <View style={styles.hoursHeaderText}>
                  <SmartText variant="overline" style={styles.cardOverline}>
                    Availability
                  </SmartText>
                  <SmartText variant="h4" style={styles.hoursTitle}>
                    Support Hours
                  </SmartText>
                </View>
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

          <View style={styles.sectionSpacer} />

          <Animated.View entering={FadeInUp.delay(400)} style={[styles.actions, isTablet && styles.actionsWide]}>
            <Animated.View entering={FadeInUp.delay(500)} layout={Layout.springify()}>
              <TouchableOpacity
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
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600)} layout={Layout.springify()}>
              <TouchableOpacity
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
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700)} layout={Layout.springify()}>
              <TouchableOpacity
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
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
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
    paddingBottom: responsiveSize.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
    zIndex: 2,
  },
  headerInner: {
    width: '100%',
  },
  headerInnerTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  headerOverline: {
    color: colors.primary.main,
    marginBottom: responsiveSize.xs,
    opacity: 0.9,
  },
  headerTitle: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: responsiveSize.md,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  intro: {
    color: colors.text.secondary,
    lineHeight: moderateScale(22),
    marginBottom: responsiveSize.xs,
  },

  sectionSpacer: {
    height: responsiveSize.lg,
  },

  hoursCard: {
    marginBottom: responsiveSize.sm,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.md,
    gap: responsiveSize.sm,
  },
  hoursHeaderIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary.main}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoursHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardOverline: {
    color: colors.primary.main,
    marginBottom: responsiveSize.xs / 2,
  },
  hoursTitle: {
    color: colors.text.primary,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
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
    borderRadius: borderRadius.xl,
    paddingVertical: responsiveSize.md,
    paddingHorizontal: responsiveSize.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[100],
    ...cardChromeSm,
  },

  chatBtn: {
    backgroundColor: colors.primary.main,
    borderWidth: 0,
    borderRadius: borderRadius.full,
    elevation: 0,
    ...(Platform.OS === 'ios' ? platformStyles.shadow : {}),
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
    minWidth: 0,
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
