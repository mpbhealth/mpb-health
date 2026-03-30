import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import {
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Percent,
} from 'lucide-react-native';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { useDiscountServices, type DiscountService } from '@/hooks/useDiscountServices';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, cardChromeSm } from '@/utils/scaling';
import {
  hubScreenHeader,
  hubHeaderA11y,
  hubScreenScroll,
  hubListRow,
  hubScreenStates,
} from '@/utils/hubListScreenLayout';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { screenChrome } from '@/utils/screenChrome';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

function AnimatedServiceCard({
  service,
  index,
  onPress,
}: {
  service: DiscountService;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  const ServiceIcon = service.icon;

  return (
    <Animated.View entering={FadeInUp.delay(300 + index * 100)} layout={Layout.springify()}>
      <AnimatedTouchableOpacity
        style={[hubListRow.card, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Open ${service.title}`}
      >
        <View style={hubListRow.rowInner}>
          <View style={[hubListRow.iconTile, { backgroundColor: service.gradient }]}>
            <ServiceIcon size={moderateScale(22)} color={service.color} />
          </View>
          <View style={styles.textContainer}>
            <SmartText variant="body1" style={hubListRow.rowTitle}>
              {service.title}
            </SmartText>
            <SmartText variant="body2" style={hubListRow.rowDescription}>
              {service.description}
            </SmartText>

            {service.codes && service.codes.length > 0 && (
              <View style={styles.codesContainer}>
                <SmartText variant="caption" style={styles.codesHeader}>
                  Member discount codes
                </SmartText>
                {service.codes.map((codeItem, i) => (
                  <View key={`${service.id}-code-${i}`} style={styles.codeRow}>
                    <View style={[styles.codeChip, { backgroundColor: service.color }]}>
                      <SmartText variant="caption" style={styles.codeText}>
                        {codeItem.code}
                      </SmartText>
                    </View>
                    <SmartText variant="body2" style={styles.codeDescription}>
                      {codeItem.description}
                    </SmartText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={[hubListRow.openHint, { borderWidth: 0, backgroundColor: service.gradient }]}>
          <ExternalLink size={moderateScale(18)} color={service.color} />
        </View>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
}

export default function DiscountsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();
  const { services, loading, error, refetch } = useDiscountServices();
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const headerStyle = [hubScreenHeader.bar, { paddingTop: headerPaddingTop }];

  // Disable swipe gesture when WebView is open
  useEffect(() => {
    if (selectedUrl) {
      navigation.setOptions({
        gestureEnabled: false,
      });
    } else {
      navigation.setOptions({
        gestureEnabled: true,
      });
    }
  }, [selectedUrl, navigation]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedUrl) {
        setSelectedUrl(null);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [selectedUrl]);

  if (selectedUrl) {
    return (
      <Animated.View style={screenChrome.container} entering={SlideInRight} exiting={SlideOutLeft}>
        <View style={headerStyle}>
          <BackButton onPress={() => setSelectedUrl(null)} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h3" style={hubScreenHeader.detailTitle} {...hubHeaderA11y.detailTitle}>
              Discounts
            </SmartText>
          </View>
        </View>
        <WebViewContainer url={selectedUrl} />
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
              Discounts
            </SmartText>
          </View>
        </Animated.View>
        <View style={hubScreenStates.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={hubScreenStates.loadingText}>Loading discounts...</SmartText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
              Discounts
            </SmartText>
          </View>
        </Animated.View>
        <View style={hubScreenStates.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={hubScreenStates.errorTitle}>Unable to Load Discounts</SmartText>
          <SmartText variant="body2" style={hubScreenStates.errorText}>{error}</SmartText>
          <TouchableOpacity style={hubScreenStates.retryButton} onPress={refetch}>
            <RefreshCw size={moderateScale(20)} color={colors.background.default} />
            <SmartText variant="body1" style={hubScreenStates.retryButtonText}>Retry</SmartText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
              Discounts
            </SmartText>
          </View>
        </Animated.View>
        <EmptyState
          icon={<Percent size={moderateScale(48)} color={colors.gray[300]} />}
          message="No discounts available at this time"
          actionLabel="Contact Concierge"
          onAction={() => router.push('/chatWithConcierge' as never)}
        />
      </View>
    );
  }

  return (
    <View style={screenChrome.container}>
      <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <View style={hubScreenHeader.content}>
          <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
            Discounts
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
            <SmartText variant="body1" style={hubScreenScroll.description}>
              Save on prescriptions, supplements, and medical services with exclusive member discounts and special pricing.
            </SmartText>
          </Animated.View>

          <View style={hubScreenScroll.listGap}>
            {services.map((service, index) => (
              <AnimatedServiceCard
                key={service.id}
                service={service}
                index={index}
                onPress={() => setSelectedUrl(service.url)}
              />
            ))}
          </View>

          <Animated.View entering={FadeInUp.delay(700)}>
            <Card padding="none" variant="elevated" style={styles.supportCard}>
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => router.push('/(tabs)/chat' as never)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Contact Concierge for help finding discounts"
              >
                <View style={styles.supportContent}>
                  <SmartText variant="h4" style={styles.supportButtonText}>
                    Need help finding discounts?
                  </SmartText>
                  <SmartText variant="body2" style={styles.supportSubtext}>
                    Contact our Concierge team for assistance
                  </SmartText>
                </View>
                <View
                  style={[
                    styles.supportChevron,
                    { backgroundColor: rgbaFromHex(colors.primary.main, 0.15) },
                  ]}
                >
                  <ExternalLink size={moderateScale(16)} color={colors.primary.main} />
                </View>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },

  codesContainer: {
    marginTop: responsiveSize.sm,
    padding: responsiveSize.sm,
    backgroundColor: rgbaFromHex(colors.primary.dark, 0.08),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: rgbaFromHex(colors.primary.dark, 0.12),
  },
  codesHeader: {
    fontWeight: '600',
    color: colors.primary.dark,
    marginBottom: responsiveSize.xs,
    textTransform: 'uppercase',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.xs,
    gap: responsiveSize.xs,
  },
  codeChip: {
    paddingHorizontal: responsiveSize.sm,
    paddingVertical: responsiveSize.xs / 2,
    borderRadius: borderRadius.sm,
    minWidth: moderateScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    ...cardChromeSm,
    flexShrink: 0,
  },
  codeText: {
    fontWeight: '700',
    color: colors.background.default,
    textAlign: 'center',
  },
  codeDescription: {
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },

  supportCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
  },
  supportButton: {
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
  },
  supportContent: {
    flex: 1,
    marginRight: responsiveSize.sm,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  supportButtonText: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  supportSubtext: {
    color: colors.text.secondary,
  },
  supportChevron: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

});
