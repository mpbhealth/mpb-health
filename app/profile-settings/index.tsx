import { View, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Key, Mail, ChevronRight, Shield, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { colors, borderRadius } from '@/constants/theme';
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

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();

  const securityOptions = [
    {
      title: 'Change Email Address',
      description: 'Update the email address associated with your account',
      icon: Mail,
      route: '/profile-settings/change-email',
      color: colors.primary.main,
      gradient: rgbaFromHex(colors.primary.main, 0.15)
    },
    {
      title: 'Change Password',
      description: 'Update your account password',
      icon: Key,
      route: '/profile-settings/change-password',
      color: colors.secondary.main,
      gradient: rgbaFromHex(colors.secondary.main, 0.15)
    }
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Security Settings</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" style={styles.introCard}>
              <View style={styles.introIconContainer}>
                <Lock size={moderateScale(22)} color={colors.primary.main} />
              </View>
              <View style={styles.introContent}>
                <SmartText variant="h3" style={styles.introTitle}>Account Security</SmartText>
                <SmartText variant="body1" style={styles.introText}>
                  Protect your account by regularly updating your security settings. Use a strong password and keep your email address up to date.
                </SmartText>
              </View>
            </Card>
          </Animated.View>

          <View style={styles.optionsGrid}>
            {securityOptions.map((option, index) => (
              <AnimatedTouchableOpacity
                key={option.title}
                style={styles.optionCard}
                onPress={() => router.push(option.route as never)}
                entering={FadeInUp.delay(300 + index * 100)}
                activeOpacity={0.8}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, { backgroundColor: option.gradient }]}>
                    <option.icon size={moderateScale(24)} color={option.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <SmartText variant="body1" style={styles.optionTitle}>{option.title}</SmartText>
                    <SmartText variant="body2" style={styles.optionDescription}>{option.description}</SmartText>
                  </View>
                </View>
                <View style={[styles.chevronContainer, { backgroundColor: option.gradient }]}>
                  <ChevronRight size={moderateScale(18)} color={option.color} />
                </View>
              </AnimatedTouchableOpacity>
            ))}
          </View>
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
    padding: responsiveSize.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...platformStyles.shadowSm,
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
  },
  content: {
    flex: 1,
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

  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.sm,
    marginBottom: responsiveSize.lg,
  },
  introIconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  introContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  introTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  introText: {
    color: colors.text.secondary,
  },

  optionsGrid: {
    gap: responsiveSize.md,
  },
  optionCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    minWidth: 0,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  optionTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionDescription: {
    color: colors.text.secondary,
  },
  chevronContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
