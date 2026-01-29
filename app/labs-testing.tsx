import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
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
import { useLabsTesting, type LabsTestingService } from '@/hooks/useLabsTesting';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';
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
    <AnimatedTouchableOpacity
      style={[styles.serviceCard, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInUp.delay(300 + index * 100)}
      layout={Layout.springify()}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Open ${service.title}`}
    >
      <View style={styles.serviceContent}>
        <View style={[styles.iconContainer, { backgroundColor: service.gradient }]}>
          <ServiceIcon size={moderateScale(24)} color={service.color} />
        </View>
        <View style={styles.textContainer}>
          <SmartText variant="body1" style={styles.serviceTitle}>
            {service.title}
          </SmartText>
          <SmartText variant="body2" style={styles.serviceDescription}>
            {service.description}
          </SmartText>
        </View>
      </View>
      <View style={[styles.chevronContainer, { backgroundColor: service.gradient }]}>
        <ExternalLink size={moderateScale(18)} color={service.color} />
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function LabsTestingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { services, loading, error, refetch } = useLabsTesting();
  const { isTablet } = useResponsive();

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
      <Animated.View style={styles.container} entering={SlideInRight} exiting={SlideOutLeft}>
        <View style={styles.header}>
          <BackButton
            onPress={() => {
              if (!handleBackWithinWebView()) router.back();
            }}
          />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>RX & Diagnostics</SmartText>
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
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>RX & Diagnostics</SmartText>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={styles.loadingText}>Loading services...</SmartText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>RX & Diagnostics</SmartText>
        </Animated.View>
        <View style={styles.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={styles.errorTitle}>Unable to Load Services</SmartText>
          <SmartText variant="body2" style={styles.errorText}>{error}</SmartText>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <RefreshCw size={moderateScale(20)} color={colors.background.default} />
            <SmartText variant="body1" style={styles.retryButtonText}>Retry</SmartText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>RX & Diagnostics</SmartText>
        </Animated.View>
        <View style={styles.emptyContainer}>
          <SmartText variant="body1" style={styles.emptyText}>No services available at this time</SmartText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>RX & Diagnostics</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={styles.description}>
              Access affordable laboratory testing and imaging services through our trusted partners.
              Compare prices, find convenient locations, and schedule your appointments with ease.
            </SmartText>
          </Animated.View>

          <View style={styles.servicesGrid}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background.paper
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
    flex: 1
  },
  scrollContent: {
    padding: responsiveSize.md,
    paddingBottom: responsiveSize.xl
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

  servicesGrid: {
    gap: responsiveSize.md,
    marginBottom: responsiveSize.lg
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    minWidth: 0,
  },

  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  serviceTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  serviceDescription: {
    color: colors.text.secondary,
  },

  chevronContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  warningCard: {
    backgroundColor: rgbaFromHex(colors.status.warning, 0.08),
    borderColor: rgbaFromHex(colors.status.warning, 0.2),
    marginBottom: responsiveSize.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
    gap: responsiveSize.md,
  },
  loadingText: {
    color: colors.text.secondary,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
    gap: responsiveSize.md,
  },
  errorTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadow,
  },
  retryButtonText: {
    fontWeight: '600',
    color: colors.background.default,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
