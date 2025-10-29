// src/screens/PremiumHSAScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  Phone,
  Brain,
  Heart,
  Wallet,
  MessageSquare,
  FileText,
  Leaf,
  ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';

export default function PremiumHSAScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const { userData, loading } = useUserData();
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);

  if (loading) {
    return <LoadingIndicator />;
  }

  // Cancellation WebView
  if (showCancellation) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => setShowCancellation(false)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Cancel Membership</Text>
          </View>
        </Animated.View>
        <View style={[styles.webviewWrapper, { paddingBottom: insets.bottom }]}>
          <WebViewContainer url="https://www.cognitoforms.com/MPoweringBenefits1/MembershipCancellationSurvey" />
        </View>
      </View>
    );
  }

  // Plan Details WebView
  if (showPlanDetails) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => setShowPlanDetails(false)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Plan Details</Text>
          </View>
        </Animated.View>
        <View style={[styles.webviewWrapper, { paddingBottom: insets.bottom }]}>
          <WebViewContainer url="https://mpb.health/3d-flip-book/premium-hsa/" />
        </View>
      </View>
    );
  }

  // Benefits list (non-clickable)
  const benefits = [
    { title: 'Medical Cost Sharing', icon: Shield, color: colors.primary.main },
    { title: '24/7/365 Telehealth', icon: Phone, color: colors.secondary.main },
    { title: 'Mental Health Support', icon: Brain, color: colors.primary.dark },
    { title: 'Minimum Essential Coverage', icon: Heart, color: colors.secondary.dark },
    { title: 'Health Savings Account', icon: Wallet, color: colors.primary.light },
    { title: 'Concierge Service', icon: MessageSquare, color: colors.secondary.light },
    { title: 'Medical Records', icon: FileText, color: colors.primary.main },
    { title: 'Wellness Products', icon: Leaf, color: colors.secondary.main },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Plan Details</Text>
      </Animated.View>

      {/* Main content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {/* Profile Card */}
        <Animated.View style={styles.profileCard} entering={FadeInUp.delay(200)}>
          <Image
            source={{ uri: 'https://i.postimg.cc/FRx3DWgd/logo.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>
                {userData?.first_name} {userData?.last_name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Member ID</Text>
              <Text style={styles.value}>{userData?.member_id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Plan Name</Text>
              <Text style={styles.value}>{userData?.product_label}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.label}>Benefit</Text>
              <Text style={styles.value}>{userData?.product_benefit}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Benefits Grid */}
        <View style={[styles.benefitsGrid, isWide && styles.benefitsGridWide]}>
          {benefits.map((b, i) => (
            <Animated.View
              key={b.title}
              style={[styles.benefitCard, isWide && styles.benefitCardWide]}
              entering={FadeInUp.delay(300 + i * 50)}
              layout={Layout.springify()}
            >
              <b.icon size={24} color={b.color} />
              <Text style={styles.benefitTitle}>{b.title}</Text>
            </Animated.View>
          ))}
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => setShowPlanDetails(true)}
          activeOpacity={0.8}
        >
          <View style={styles.viewDetailsContent}>
            <ExternalLink size={20} color={colors.background.default} />
            <Text style={styles.viewDetailsText}>View Full Plan Details</Text>
          </View>
        </TouchableOpacity>

        {/* Cancel Membership Link */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowCancellation(true)}
          activeOpacity={0.6}
        >
          <Text style={styles.cancelButtonText}>Cancel My Membership</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },

  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerContent: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  title: { ...typography.h2, color: colors.text.primary, marginLeft: spacing.sm },

  webviewWrapper: { flex: 1 },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  profileCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  logo: {
    width: '100%',
    height: 50,
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  profileInfo: {},
  infoRow: { marginBottom: spacing.sm },
  infoRowLast: { marginBottom: spacing.sm },
  label: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: { ...typography.body1, fontWeight: '600', color: colors.text.primary },

  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  benefitsGridWide: {},
  benefitCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  benefitCardWide: { width: '31%' },
  benefitTitle: {
    ...typography.caption,
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontWeight: '500',
  },

  viewDetailsButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  viewDetailsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },

  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cancelButtonText: {
    ...typography.body2,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
