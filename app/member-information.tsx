import { View, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { User, ExternalLink, Shield, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

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
  const { isTablet } = useResponsive();
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
            <SmartText variant="h3" style={styles.headerTitle}>Member Portal</SmartText>
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
        <SmartText variant="h2" style={styles.title}>Personal Information</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="lg" style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.iconContainer}>
                  <User size={moderateScale(22)} color={colors.primary.main} />
                </View>
                <SmartText variant="h3" style={styles.cardTitle}>Your Information</SmartText>
              </View>

              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <SmartText variant="body2" style={styles.label}>Name</SmartText>
                  <SmartText variant="body1" style={styles.value}>
                    {userData?.first_name} {userData?.last_name}
                  </SmartText>
                </View>

                <View style={styles.infoRow}>
                  <SmartText variant="body2" style={styles.label}>Member ID</SmartText>
                  <SmartText variant="body1" style={styles.value}>{userData?.member_id}</SmartText>
                </View>

                <View style={styles.infoRowLast}>
                  <SmartText variant="body2" style={styles.label}>Email</SmartText>
                  <SmartText variant="body1" style={styles.value}>{userData?.email}</SmartText>
                </View>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)}>
            <Card padding="md" variant="outlined" style={styles.securityCard}>
              <Shield size={moderateScale(22)} color={colors.status.info} style={{ marginRight: responsiveSize.sm }} />
              <View style={styles.securityContent}>
                <SmartText variant="body1" style={styles.securityTitle}>Secure Access</SmartText>
                <SmartText variant="body2" style={styles.securityText}>
                  For detailed personal information and account management, access our secure member portal.
                </SmartText>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)}>
            <Card padding="lg" style={styles.actionCard}>
              <TouchableOpacity
                style={styles.portalButton}
                onPress={() => setShowPortal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.portalButtonContent}>
                  <View style={styles.portalIconContainer}>
                    <ExternalLink size={moderateScale(22)} color={colors.background.default} />
                  </View>
                  <View style={styles.portalTextContainer}>
                    <SmartText variant="body1" style={styles.portalButtonText}>Access Member Portal</SmartText>
                    <SmartText variant="body2" style={styles.portalButtonSubtext}>
                      View complete personal information
                    </SmartText>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.noteContainer}>
                <AlertCircle size={moderateScale(14)} color={colors.text.secondary} />
                <SmartText variant="caption" style={styles.noteText}>
                  You'll need your portal credentials to access detailed information
                </SmartText>
              </View>
            </Card>
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

  infoCard: {
    marginBottom: responsiveSize.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
    gap: responsiveSize.sm,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.15),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoContent: {
    gap: responsiveSize.md,
  },
  infoRow: {
    paddingBottom: responsiveSize.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoRowLast: {
    paddingBottom: 0,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.xs / 2,
  },
  value: {
    fontWeight: '600',
    color: colors.text.primary,
  },

  securityCard: {
    backgroundColor: rgbaFromHex(colors.status.info, 0.08),
    borderColor: rgbaFromHex(colors.status.info, 0.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.lg,
  },
  securityContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  securityTitle: {
    fontWeight: '600',
    color: colors.status.info,
  },
  securityText: {
    color: colors.status.info,
  },

  actionCard: {
    gap: responsiveSize.md,
  },
  portalButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadow,
  },
  portalButtonContent: {
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  portalIconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    backgroundColor: rgbaFromHex(colors.background.default, 0.2),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  portalTextContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  portalButtonText: {
    fontWeight: '600',
    color: colors.background.default,
  },
  portalButtonSubtext: {
    color: colors.background.default,
    opacity: 0.9,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs / 2,
    paddingHorizontal: responsiveSize.xs,
  },
  noteText: {
    flex: 1,
    color: colors.text.secondary,
  },
});
