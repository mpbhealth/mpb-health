import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Lock, Eye, FileText, ExternalLink, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useState } from 'react';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function PrivacyPolicyScreen() {
  const router = useRouter();
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
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
        <Text style={styles.title}>Privacy & Terms</Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={styles.introCard}
          entering={FadeInUp.delay(200)}
        >
          <Shield size={24} color={colors.primary.main} />
          <View style={styles.introContent}>
            <Text style={styles.lastUpdated}>Last Updated: March 20, 2024</Text>
            <Text style={styles.introText}>
              Your privacy is our top priority. We are committed to protecting your personal and health information through industry-leading security measures and transparent data practices.
            </Text>
          </View>
        </Animated.View>

        {sections.map((section, index) => (
          <Animated.View
            key={section.title}
            style={styles.sectionCard}
            entering={FadeInUp.delay(300 + index * 100)}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${section.color}15` }]}>
                <section.icon size={24} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View 
          style={styles.infoCard}
          entering={FadeInUp.delay(600)}
        >
          <AlertCircle size={24} color={colors.status.info} />
          <Text style={styles.infoText}>
            For questions about your privacy or to exercise your data rights, please contact our Privacy Officer at info@mympb.com
          </Text>
        </Animated.View>

        <AnimatedTouchableOpacity
          style={styles.viewFullButton}
          onPress={() => setShowFullPolicy(true)}
          entering={FadeInUp.delay(700)}
        >
          <View style={styles.viewFullContent}>
            <ExternalLink size={20} color={colors.background.default} />
            <Text style={styles.viewFullText}>View Full Privacy Policy</Text>
          </View>
        </AnimatedTouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MPowering Benefits INC{'\n'}
            5301 N Federal Hwy, Suite 155{'\n'}
            Boca Raton, FL 33487
          </Text>
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
    ...shadows.sm
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
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
  introContent: {
    flex: 1,
  },
  lastUpdated: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  introText: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 24,
  },
  sectionCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  sectionContent: {
    padding: spacing.lg,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bullet: {
    ...typography.body1,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: `${colors.status.info}08`,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    ...typography.body1,
    color: colors.status.info,
    lineHeight: 24,
  },
  viewFullButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  viewFullContent: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  viewFullText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },
  footer: {
    marginBottom: spacing.xxl,
  },
  footerText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});