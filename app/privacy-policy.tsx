import { View, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Lock, Eye, FileText, ExternalLink, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useState } from 'react';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  const sections = [
    {
      title: 'Data Collection',
      icon: Eye,
      color: colors.primary.main,
      items: [
        'Personal Information: Name, email, phone number',
        'Health Data: Medical history and records',
        'Device Information: IP address, device type',
        'Usage Data: App interactions and preferences'
      ]
    },
    {
      title: 'Data Protection',
      icon: Lock,
      color: colors.secondary.main,
      items: [
        'Industry-standard encryption protocols',
        'Regular security audits and updates',
        'Secure data storage and transmission',
        'Access controls and authentication'
      ]
    },
    {
      title: 'Data Usage',
      icon: FileText,
      color: colors.primary.dark,
      items: [
        'Providing and improving our services',
        'Processing medical cost sharing requests',
        'Communication about your membership',
        'Legal compliance and regulations'
      ]
    }
  ];

  if (showFullPolicy) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => setShowFullPolicy(false)} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Privacy Policy</SmartText>
          </View>
        </View>
        <WebViewContainer url="https://mpb.health/app-privacy-policy/" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Privacy & Terms</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" style={styles.introCard}>
              <Shield size={moderateScale(22)} color={colors.primary.main} style={{ marginRight: responsiveSize.sm }} />
              <View style={styles.introContent}>
                <SmartText variant="caption" style={styles.lastUpdated}>Last Updated: March 20, 2024</SmartText>
                <SmartText variant="body1" style={styles.introText}>
                  Your privacy is our top priority. We are committed to protecting your personal and health information through industry-leading security measures and transparent data practices.
                </SmartText>
              </View>
            </Card>
          </Animated.View>

          {sections.map((section, index) => (
            <Animated.View
              key={section.title}
              entering={FadeInUp.delay(300 + index * 100)}
            >
              <Card padding="none" style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${section.color}15` }]}>
                    <section.icon size={moderateScale(22)} color={section.color} />
                  </View>
                  <SmartText variant="h3" style={styles.sectionTitle}>{section.title}</SmartText>
                </View>
                <View style={styles.sectionContent}>
                  {section.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.bulletPoint}>
                      <SmartText variant="body1" style={styles.bullet}>•</SmartText>
                      <SmartText variant="body1" style={styles.bulletText}>{item}</SmartText>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          ))}

          <Animated.View entering={FadeInUp.delay(600)}>
            <Card padding="md" variant="outlined" style={styles.infoCard}>
              <AlertCircle size={moderateScale(22)} color={colors.status.info} style={{ marginRight: responsiveSize.sm }} />
              <SmartText variant="body1" style={styles.infoText}>
                For questions about your privacy or to exercise your data rights, please contact our Privacy Officer at info@mympb.com
              </SmartText>
            </Card>
          </Animated.View>

          <AnimatedTouchableOpacity
            style={styles.viewFullButton}
            onPress={() => setShowFullPolicy(true)}
            entering={FadeInUp.delay(700)}
          >
            <View style={styles.viewFullContent}>
              <ExternalLink size={moderateScale(18)} color={colors.background.default} />
              <SmartText variant="body1" style={styles.viewFullText}>View Full Privacy Policy</SmartText>
            </View>
          </AnimatedTouchableOpacity>

          <View style={styles.footer}>
            <SmartText variant="body2" style={styles.footerText}>
              MPowering Benefits INC{'\n'}
              5301 N Federal Hwy, Suite 155{'\n'}
              Boca Raton, FL 33487
            </SmartText>
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
  headerContent: {
    flex: 1,
    marginLeft: responsiveSize.xs,
  },
  headerTitle: {
    fontWeight: '600',
    color: colors.text.primary,
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
    marginBottom: responsiveSize.lg,
  },
  introContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs,
  },
  lastUpdated: {
    color: colors.text.secondary,
  },
  introText: {
    color: colors.text.primary,
  },

  sectionCard: {
    marginBottom: responsiveSize.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSize.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: responsiveSize.sm,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionContent: {
    padding: responsiveSize.md,
    gap: responsiveSize.xs,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.xs,
  },
  bullet: {
    color: colors.text.secondary,
    marginTop: moderateScale(1),
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    color: colors.text.secondary,
  },

  infoCard: {
    backgroundColor: `${colors.status.info}08`,
    borderColor: `${colors.status.info}20`,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.lg,
  },
  infoText: {
    flex: 1,
    color: colors.status.info,
  },

  viewFullButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    marginBottom: responsiveSize.lg,
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadow,
  },
  viewFullContent: {
    padding: responsiveSize.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  viewFullText: {
    color: colors.background.default,
    fontWeight: '600',
  },

  footer: {
    marginBottom: responsiveSize.xl,
  },
  footerText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
