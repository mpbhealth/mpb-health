import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ExternalLink, AlertTriangle, Building2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function SharingScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const { userData, loading } = useUserData();
  const [selectedProgram, setSelectedProgram] = useState<{
    title: string;
    url: string;
    color: string;
  } | null>(null);

  // Product IDs that should see Zion Health
  const zionHealthProductIds = [
    '29795', '29870', '30445', '30658', '30659', '31103',
    '32399', '35693', '35768', '35770', '40416', '42464',
    '42465', '42467', '42469', '42551', '42552', '42553',
    '45800', '46405', '45742', '47182'
  ];

  // Product IDs that should see Sedera Health
  const sederaHealthProductIds = ['43957', '44036','46455', ,'38035'];

  // Determine which programs to show based on product_id
  const availablePrograms = [];

  if (userData?.product_id) {
    if (zionHealthProductIds.includes(userData.product_id)) {
      availablePrograms.push({
        title: 'Zion Health',
        description: 'Access your Zion Health sharing program to submit and manage your medical needs',
        url: 'https://members.zionhealthshare.org/dashboard',
        color: colors.primary.main,
        gradient: `${colors.primary.main}15`,
      });
    }

    if (sederaHealthProductIds.includes(userData.product_id)) {
      availablePrograms.push({
        title: 'Sedera Health',
        description: 'Access your Sedera Health sharing program to submit and track your medical needs',
        url: 'https://sedera.my.site.com/MemberPortal/s/login/',
        color: colors.secondary.main,
        gradient: `${colors.secondary.main}15`,
      });
    }
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  if (selectedProgram) {
    return (
      <Animated.View
        style={styles.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={styles.header}>
          <BackButton onPress={() => setSelectedProgram(null)} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>{selectedProgram.title}</SmartText>
          </View>
        </View>

        <WebViewContainer url={selectedProgram.url} />
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Sharing</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={styles.description}>
              Our sharing connect you with a community of health-conscious individuals who share in each other's medical expenses. Submit and manage your medical needs through your designated sharing program.
            </SmartText>
          </Animated.View>

          <View style={styles.programsGrid}>
            {availablePrograms.map((program, index) => (
              <AnimatedTouchableOpacity
                key={program.title}
                style={styles.programCard}
                onPress={() => setSelectedProgram(program)}
                entering={FadeInUp.delay(300 + index * 100)}
                layout={Layout.springify()}
              >
                <View style={styles.programContent}>
                  <View style={[styles.iconContainer, { backgroundColor: program.gradient }]}>
                    <Building2 size={moderateScale(26)} color={program.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <SmartText variant="body1" style={styles.programTitle}>
                      {program.title}
                    </SmartText>
                    <SmartText variant="body2" style={styles.programDescription}>
                      {program.description}
                    </SmartText>
                  </View>
                </View>
                <ExternalLink size={moderateScale(18)} color={program.color} />
              </AnimatedTouchableOpacity>
            ))}
          </View>

          <Animated.View entering={FadeInUp.delay(400)}>
            <Card padding="md" variant="outlined" style={styles.warningCard}>
              <AlertTriangle size={moderateScale(22)} color={colors.status.warning} style={{ marginRight: responsiveSize.sm }} />
              <View style={styles.warningContent}>
                <SmartText variant="body2" style={styles.warningText}>
                  Once you have met your initial unshareable amount, you may open a need through the sharing program included in your membership. If you are unsure which sharing program you are enrolled in, please contact our concierge for assistance.
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

  description: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.lg,
  },

  programsGrid: {
    gap: responsiveSize.md,
    marginBottom: responsiveSize.lg,
  },

  programCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },
  programContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    minWidth: 0,
  },
  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  programTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  programDescription: {
    color: colors.text.secondary,
  },

  warningCard: {
    backgroundColor: rgbaFromHex(colors.status.warning, 0.08),
    borderColor: rgbaFromHex(colors.status.warning, 0.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningContent: {
    flex: 1,
    minWidth: 0,
  },
  warningText: {
    color: colors.status.warning,
  },
});
