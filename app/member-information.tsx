import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { User, ExternalLink, Shield, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

// Helper to convert HEX → RGBA
function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { userData, loading } = useUserData();
  const [showPortal, setShowPortal] = useState(false);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (showPortal) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => setShowPortal(false)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Member Portal</Text>
          </View>
        </View>
        <WebViewContainer url="https://www.1enrollment.com/index.cfm?id=364279" />
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
        <Text style={styles.title}>Personal Information</Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={styles.infoCard}
          entering={FadeInUp.delay(200)}
        >
          <View style={styles.infoHeader}>
            <View style={styles.iconContainer}>
              <User size={24} color={colors.primary.main} />
            </View>
            <Text style={styles.cardTitle}>Your Information</Text>
          </View>
          
          <View style={styles.infoContent}>
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
            
            <View style={styles.infoRowLast}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{userData?.email}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={styles.securityCard}
          entering={FadeInUp.delay(300)}
        >
          <Shield size={24} color={colors.status.info} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure Access</Text>
            <Text style={styles.securityText}>
              For detailed personal information and account management, access our secure member portal.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={styles.actionCard}
          entering={FadeInUp.delay(400)}
        >
          <TouchableOpacity
            style={styles.portalButton}
            onPress={() => setShowPortal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.portalButtonContent}>
              <View style={styles.portalIconContainer}>
                <ExternalLink size={24} color={colors.background.default} />
              </View>
              <View style={styles.portalTextContainer}>
                <Text style={styles.portalButtonText}>Access Member Portal</Text>
                <Text style={styles.portalButtonSubtext}>
                  View complete personal information
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.noteContainer}>
            <AlertCircle size={16} color={colors.text.secondary} />
            <Text style={styles.noteText}>
              You'll need your portal credentials to access detailed information
            </Text>
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
    fontWeight: '700',
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
  infoCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoContent: {
    gap: spacing.md,
  },
  infoRow: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoRowLast: {
    paddingBottom: 0,
  },
  label: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  securityCard: {
    backgroundColor: rgbaFromHex(colors.status.info, 0.08),
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.status.info,
    marginBottom: spacing.xs,
  },
  securityText: {
    ...typography.body2,
    color: colors.status.info,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  portalButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  portalButtonContent: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  portalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: rgbaFromHex(colors.background.default, 0.2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalTextContainer: {
    flex: 1,
  },
  portalButtonText: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.background.default,
    marginBottom: spacing.xs / 2,
  },
  portalButtonSubtext: {
    ...typography.body2,
    color: colors.background.default,
    opacity: 0.9,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  noteText: {
    flex: 1,
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
