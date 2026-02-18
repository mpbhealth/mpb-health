import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { useUserData } from '@/hooks/useUserData';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDob(dob: string | null | undefined): string {
  if (!dob) return '—';
  const s = String(dob).trim();
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    if (y && m && d) return `${m}/${d}/${y}`;
  }
  if (s.length === 8) {
    return `${s.slice(4, 6)}/${s.slice(6, 8)}/${s.slice(0, 4)}`;
  }
  return s;
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();
  const { userData, loading } = useUserData();

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.header, { paddingTop: headerPaddingTop }]}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Personal Information</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}
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

                <View style={styles.infoRow}>
                  <SmartText variant="body2" style={styles.label}>Date of Birth</SmartText>
                  <SmartText variant="body1" style={styles.value}>{formatDob(userData?.dob)}</SmartText>
                </View>

                <View style={styles.infoRowLast}>
                  <SmartText variant="body2" style={styles.label}>Email</SmartText>
                  <SmartText variant="body1" style={styles.value}>{userData?.email}</SmartText>
                </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
    flex: 1,
    minWidth: 0,
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
});
