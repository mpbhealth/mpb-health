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
import { responsiveSize, moderateScale } from '@/utils/scaling';
import {
  hubScreenHeader,
  hubHeaderA11y,
  hubScreenScroll,
  hubListRow,
} from '@/utils/hubListScreenLayout';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { screenChrome } from '@/utils/screenChrome';
import { useResponsive } from '@/hooks/useResponsive';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';

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
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
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
  const sederaHealthProductIds = ['43957', '44036', '46455', '38035', '38036'];

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
        style={screenChrome.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={[hubScreenHeader.bar, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={() => setSelectedProgram(null)} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h3" style={hubScreenHeader.detailTitle} {...hubHeaderA11y.detailTitle}>
              {selectedProgram.title}
            </SmartText>
          </View>
        </View>

        <WebViewContainer url={selectedProgram.url} />
      </Animated.View>
    );
  }

  return (
    <View style={screenChrome.container}>
      <Animated.View
        style={[hubScreenHeader.bar, { paddingTop: headerPaddingTop }]}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <View style={hubScreenHeader.content}>
          <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
            Sharing
          </SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={[hubScreenScroll.content, hubScreenScroll.contentShade]}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[screenChrome.scrollContent, hubScreenScroll.scrollPad, { paddingBottom: scrollContentPaddingBottom + responsiveSize.xl }]}
      >
        <View style={[hubScreenScroll.maxWidthContainer, isTablet && hubScreenScroll.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={[hubScreenScroll.description, styles.descriptionTight]}>
              Sharing programs connect you with a community of members who share eligible medical expenses. Open your portal below to submit and manage needs through your plan.
            </SmartText>
          </Animated.View>

          {availablePrograms.length === 0 && (
            <Animated.View entering={FadeInUp.delay(240)}>
              <SmartText variant="body2" style={styles.emptyHint}>
                No Zion or Sedera portal is linked to your membership in the app. Contact concierge if you need help finding your sharing program.
              </SmartText>
            </Animated.View>
          )}

          <View style={hubScreenScroll.listGap}>
            {availablePrograms.map((program, index) => (
              <Animated.View
                key={program.title}
                entering={FadeInUp.delay(300 + index * 100)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  style={hubListRow.card}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${program.title}`}
                  activeOpacity={0.92}
                  onPress={() =>
                    setSelectedProgram({
                      title: program.title,
                      url: program.url,
                      color: program.color,
                    })
                  }
                >
                  <View style={hubListRow.rowInner}>
                    <View style={[hubListRow.iconTile, { backgroundColor: program.gradient }]}>
                      <Building2 size={moderateScale(24)} color={program.color} />
                    </View>
                    <View style={hubListRow.textBlock}>
                      <SmartText variant="body1" style={hubListRow.rowTitle}>
                        {program.title}
                      </SmartText>
                      <SmartText variant="body2" style={hubListRow.rowDescription}>
                        {program.description}
                      </SmartText>
                    </View>
                  </View>
                  <View style={[hubListRow.openHint, { borderWidth: 0, backgroundColor: program.gradient }]}>
                    <ExternalLink size={moderateScale(18)} color={program.color} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
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
  descriptionTight: {
    marginBottom: responsiveSize.md,
  },
  emptyHint: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.lg,
    lineHeight: 20,
    fontStyle: 'italic',
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
    lineHeight: 20,
  },
});
