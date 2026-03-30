import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  FlaskConical,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { useLabsTesting, type LabsTestingService } from '@/hooks/useLabsTesting';
import { colors } from '@/constants/theme';
import { responsiveSize, moderateScale } from '@/utils/scaling';
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
import type WebView from 'react-native-webview';

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
  service: LabsTestingService;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.2, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.1, { duration: 150 });
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
          <View style={hubListRow.textBlock}>
            <SmartText variant="body1" style={hubListRow.rowTitle}>
              {service.title}
            </SmartText>
            <SmartText variant="body2" style={hubListRow.rowDescription}>
              {service.description}
            </SmartText>
          </View>
        </View>
        <View style={[hubListRow.openHint, { borderWidth: 0, backgroundColor: service.gradient }]}>
          <ExternalLink size={moderateScale(18)} color={service.color} />
        </View>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
}

export default function LabsTestingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { services, loading, error, refetch } = useLabsTesting();
  const { isTablet } = useResponsive();
  const headerStyle = [hubScreenHeader.bar, { paddingTop: headerPaddingTop }];

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const webRef = useRef<WebView>(null);
  const wvCanGoBackRef = useRef(false);

  const handleBackWithinWebView = useCallback(() => {
    if (selectedUrl) {
      if (wvCanGoBackRef.current && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      setSelectedUrl(null);
      return true;
    }
    return false;
  }, [selectedUrl]);

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

  useFocusEffect(
    useCallback(() => {
      const sub = navigation.addListener('beforeRemove', (e: any) => {
        if (handleBackWithinWebView()) {
          e.preventDefault();
        }
      });
      return () => sub();
    }, [navigation, handleBackWithinWebView]),
  );

  useEffect(() => {
    const onBack = () => (handleBackWithinWebView() ? true : false);
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [handleBackWithinWebView]);

  if (selectedUrl) {
    return (
      <Animated.View style={screenChrome.container} entering={SlideInRight} exiting={SlideOutLeft}>
        <View style={headerStyle}>
          <BackButton
            onPress={() => {
              if (!handleBackWithinWebView()) router.back();
            }}
          />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h3" style={hubScreenHeader.detailTitle} {...hubHeaderA11y.detailTitle}>
              RX & Diagnostics
            </SmartText>
          </View>
        </View>

        <WebViewContainer
          ref={webRef as any}
          url={selectedUrl}
          onNavigationStateChange={(navState) => {
            wvCanGoBackRef.current = !!navState?.canGoBack;
          }}
        />
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
              RX & Diagnostics
            </SmartText>
          </View>
        </Animated.View>
        <View style={hubScreenStates.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={hubScreenStates.loadingText}>Loading services...</SmartText>
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
              RX & Diagnostics
            </SmartText>
          </View>
        </Animated.View>
        <View style={hubScreenStates.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={hubScreenStates.errorTitle}>Unable to Load Services</SmartText>
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
              RX & Diagnostics
            </SmartText>
          </View>
        </Animated.View>
        <EmptyState
          icon={<FlaskConical size={moderateScale(48)} color={colors.gray[300]} />}
          message="No services available at this time"
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
            RX & Diagnostics
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
              Access affordable laboratory testing and imaging services through our trusted partners.
              Compare prices, find convenient locations, and schedule your appointments with ease.
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
            <Card padding="md" variant="outlined" style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <AlertTriangle size={moderateScale(22)} color={colors.status.warning} />
                <SmartText variant="h4" style={styles.warningTitle}>Important Notice</SmartText>
              </View>
              <SmartText variant="body2" style={styles.warningText}>
                Please be advised that due to the Eliminating Kickbacks in Recovery Act (EKRA),
                certain laboratory costs exceeding your Initial Unshareable Amount (IUA) may not
                be eligible for reimbursement through healthsharing plans.
              </SmartText>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    backgroundColor: rgbaFromHex(colors.status.warning, 0.08),
    borderColor: rgbaFromHex(colors.status.warning, 0.2),
    marginBottom: responsiveSize.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.sm,
    gap: responsiveSize.sm,
  },
  warningTitle: {
    fontWeight: '600',
    color: colors.status.warning,
    flex: 1,
  },
  warningText: {
    color: colors.status.warning,
    lineHeight: 20,
  },
});
