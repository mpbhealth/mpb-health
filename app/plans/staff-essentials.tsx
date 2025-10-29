import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { BackButton } from '@/components/common/BackButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const logoImg = require('../../assets/images/logo.png');

export default function StaffEssentialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 8 : spacing.lg }]}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.content} entering={FadeInDown.delay(100)}>
          <View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>MPB Health Staff Essentials</Text>

            <View style={styles.divider} />

            <Text style={styles.description}>
              This is an exclusive health plan designed for MPB Health employees and their families.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plan Overview</Text>
              <Text style={styles.sectionText}>
                As a valued member of the MPB Health team, you have access to comprehensive healthcare benefits
                through our Staff Essentials plan. This plan provides you with the same quality care and services
                we offer to our members.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's Included</Text>
              <View style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Full access to telehealth services</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Prescription and diagnostic benefits</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Care coordination services</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Health and wellness resources</Text>
              </View>
              <View style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Discount programs and member forms</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Need Help?</Text>
              <Text style={styles.sectionText}>
                If you have questions about your Staff Essentials plan, please contact your HR department
                or reach out to our member services team through the app.
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Thank you for being part of the MPB Health family!
              </Text>
            </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logo: {
    width: 180,
    height: 48,
  },
  card: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary.main,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 2,
    backgroundColor: colors.primary.main,
    borderRadius: 1,
    marginBottom: spacing.lg,
    opacity: 0.2,
  },
  description: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.main,
    marginTop: 8,
    marginRight: spacing.sm,
  },
  bulletText: {
    ...typography.body1,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 24,
  },
  footer: {
    backgroundColor: colors.primary.main + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body1,
    color: colors.primary.main,
    textAlign: 'center',
    fontWeight: '600',
  },
});
