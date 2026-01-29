// NotificationDetailScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/common/BackButton';
import { Home, Play, Tag, MessageSquare, Shield, UserCog } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

// adjust this relative path if your file lives elsewhere; assumes logo is at <project>/assets/images/logo.png
const logoImg = require('../assets/images/logo.png');

export default function NotificationDetailScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'Quick Actions',
      description: 'The Home screen provides quick access to essential services:',
      features: [
        {
          title: 'RX & Diagnostics',
          description: 'Request custom quotes for lab testing, imaging, and prescription services.',
          icon: Shield,
          color: colors.primary.main,
        },
        {
          title: 'Member Forms',
          description: 'Access self-service forms for appointments, updates, and membership changes.',
          icon: Shield,
          color: colors.secondary.main,
        },
        {
          title: 'Find Discounts',
          description: 'Save on prescriptions, supplements, and medical services with exclusive member discounts.',
          icon: Tag,
          color: colors.primary.dark,
        },
      ],
    },
    {
      title: 'My Services',
      description: 'Manage your healthcare with comprehensive service options:',
      features: [
        {
          title: 'Telehealth',
          description: 'Available for all members - Connect to 24/7 telehealth services with board-certified physicians.',
          icon: Shield,
          color: colors.primary.light,
        },
        {
          title: 'Care Services',
          description: 'Available for all members - Find providers, access healthcare bluebook, ZocDoc, and medical records. Premium members also get provider search access.',
          icon: Shield,
          color: colors.secondary.main,
        },
        {
          title: 'Hospital Debt Relief',
          description: 'Available for Essentials and MEC Plus Essentials members - Apply for hospital debt dismissal programs.',
          icon: Shield,
          color: colors.status.warning,
        },
        {
          title: 'Sharing Programs',
          description: 'Available for all members - Submit medical needs through Zion Health or Sedera Health sharing programs.',
          icon: Shield,
          color: colors.primary.main,
        },
      ],
    },
    {
      title: 'Additional Features',
      description: 'Access helpful resources and tools:',
      features: [
        {
          title: 'What to do?',
          description: 'Learn what to do in different medical situations with step-by-step guidance.',
          icon: Shield,
          color: colors.primary.main,
        },
        {
          title: 'Healthy Podcast',
          description: 'Watch health and wellness videos to stay informed and inspired.',
          icon: Play,
          color: colors.secondary.main,
        },
        {
          title: 'Notifications',
          description: 'Stay updated with important announcements and app updates.',
          icon: Shield,
          color: colors.primary.dark,
        },
      ],
    },
  ];

  const conciergeServices = [
    'Healthcare benefits and plan questions',
    'Telehealth activation and technical support',
    'Membership updates and general assistance',
    'Appointment scheduling and provider search',
  ];

  const profileFeatures = [
    'View your Member ID and personal information',
    'Access Security Settings to change your email or password',
    'Review your Plan Details',
    'Contact your Dedicated Health Advisor directly',
    'Create app login for eligible dependents',
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">Welcome Guide</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={styles.welcomeCard} entering={FadeInUp.delay(200)}>
          <View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.welcomeTitle} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">Welcome to MPB Health!</Text>
          <Text style={styles.welcomeText} allowFontScaling={false}>
            We're excited to support you on your healthcare journey. This guide will walk you through the key features of the MPB Health mobile app, designed to help you manage your health and wellness effectively.
          </Text>
        </Animated.View>

        {sections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            style={[styles.section, styles.sectionCard]}
            entering={FadeInUp.delay(300 + sectionIndex * 100)}
          >
            <Text style={styles.sectionTitle} allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail">{section.title}</Text>
            <Text style={styles.sectionDescription} allowFontScaling={false}>{section.description}</Text>

            <View style={styles.featuresContainer}>
              {section.features.map((feature, featureIndex) => (
                <Animated.View
                  key={feature.title}
                  style={styles.featureCard}
                  entering={FadeInUp.delay(400 + featureIndex * 50)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${feature.color}15` }]}>
                    <feature.icon size={24} color={feature.color} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle} allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail">{feature.title}</Text>
                    <Text style={styles.featureDescription} allowFontScaling={false}>{feature.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View style={[styles.section, styles.sectionCard]} entering={FadeInUp.delay(500)}>
          <Text style={styles.sectionTitle} allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail">Concierge</Text>
          <Text style={styles.sectionDescription} allowFontScaling={false}>
            Tap the Concierge tab to connect with our dedicated support team.
            We're here to assist with:
          </Text>
          <View style={styles.listContainer}>
            {conciergeServices.map((service, index) => (
              <Animated.View key={index} style={styles.listItem} entering={FadeInUp.delay(600 + index * 50)}>
                <View style={[styles.bulletPoint, { backgroundColor: colors.primary.main }]} />
                <Text style={styles.listText} allowFontScaling={false}>{service}</Text>
              </Animated.View>
            ))}
          </View>
          <Text style={styles.additionalText} allowFontScaling={false}>Reach us via call or secure messaging.</Text>
        </Animated.View>

        <Animated.View style={[styles.section, styles.sectionCard, styles.lastSection]} entering={FadeInUp.delay(600)}>
          <Text style={styles.sectionTitle} allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail">Profile</Text>
          <Text style={styles.sectionDescription} allowFontScaling={false}>In the Profile tab, you can:</Text>
          <View style={styles.listContainer}>
            {profileFeatures.map((feature, index) => (
              <Animated.View key={index} style={styles.listItem} entering={FadeInUp.delay(700 + index * 50)}>
                <View style={[styles.bulletPoint, { backgroundColor: colors.secondary.main }]} />
                <Text style={styles.listText} allowFontScaling={false}>{feature}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
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
    ...shadows.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  welcomeCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
    overflow: 'hidden',
  },
  logoContainer: {
    width: '100%',
    height: 45,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: '100%',
  },
  welcomeTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
    flexShrink: 1,
  },
  welcomeText: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    flexShrink: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  lastSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  sectionDescription: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
    flexShrink: 1,
  },
  featuresContainer: {
    gap: spacing.md,
  },
  featureCard: {
    backgroundColor: `${colors.background.paper}50`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
    overflow: 'hidden',
  },
  featureTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  featureDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    lineHeight: 20,
    flexShrink: 1,
  },
  listContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  listText: {
    flex: 1,
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
    flexShrink: 1,
  },
  additionalText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    flexShrink: 1,
  },
});
