import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Key, Mail, ChevronRight, Shield, Lock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Helper to convert HEX → RGBA
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
        <Text style={styles.title}>Security Settings</Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={styles.introCard}
          entering={FadeInUp.delay(200)}
        >
          <View style={styles.introIconContainer}>
            <Lock size={24} color={colors.primary.main} />
          </View>
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Account Security</Text>
            <Text style={styles.introText}>
              Protect your account by regularly updating your security settings. Use a strong password and keep your email address up to date.
            </Text>
          </View>
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
                  <option.icon size={28} color={option.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
              <View style={[styles.chevronContainer, { backgroundColor: option.gradient }]}>
                <ChevronRight size={20} color={option.color} />
              </View>
            </AnimatedTouchableOpacity>
          ))}
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
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...shadows.md,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    ...typography.h3,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  introText: {
    ...typography.body1,
    fontWeight: '400' as const,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  optionsGrid: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 88,
    ...shadows.md,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  optionDescription: {
    ...typography.body2,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});