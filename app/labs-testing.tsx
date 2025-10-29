import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
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
import { useLabsTesting, type LabsTestingService } from '@/hooks/useLabsTesting';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
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
          <ServiceIcon size={28} color={service.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
        </View>
      </View>
      <View style={[styles.chevronContainer, { backgroundColor: service.gradient }]}>
        <ExternalLink size={20} color={service.color} />
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function LabsTestingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { services, loading, error, refetch } = useLabsTesting();

  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const webRef = useRef<WebView>(null);
  const wvCanGoBackRef = useRef(false);

  // unified back handler: try WebView -> close overlay -> allow pop
  const handleBackWithinWebView = useCallback(() => {
    if (selectedUrl) {
      if (wvCanGoBackRef.current && webRef.current) {
        webRef.current.goBack();
        return true; // handled
      }
      // close overlay
      setSelectedUrl(null);
      return true; // handled
    }
    return false; // not handled (screen can pop)
  }, [selectedUrl]);

  // Intercept navigator pops (includes iOS swipe) while screen is focused
  useFocusEffect(
    useCallback(() => {
      const sub = navigation.addListener('beforeRemove', (e: any) => {
        // If we can handle back internally, prevent the pop
        if (handleBackWithinWebView()) {
          e.preventDefault();
        }
      });
      return () => sub();
    }, [navigation, handleBackWithinWebView]),
  );

  // Android hardware back: same logic
  useEffect(() => {
    const onBack = () => (handleBackWithinWebView() ? true : false);
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [handleBackWithinWebView]);

  // Selected webview UI
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
            <Text style={styles.headerTitle}>RX & Diagnostics</Text>
          </View>
        </View>

        <WebViewContainer
          ref={webRef as any}
          url={selectedUrl}
          onNavigationStateChange={(navState) => {
            // keep a ref to avoid stale closures in listeners
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
          <Text style={styles.title}>RX & Diagnostics</Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title}>RX & Diagnostics</Text>
        </Animated.View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.status.error} />
          <Text style={styles.errorTitle}>Unable to Load Services</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <RefreshCw size={20} color={colors.background.default} />
            <Text style={styles.retryButtonText}>Retry</Text>
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
          <Text style={styles.title}>RX & Diagnostics</Text>
        </Animated.View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services available at this time</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>RX & Diagnostics</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.Text style={styles.description} entering={FadeInUp.delay(200)}>
          Access affordable laboratory testing and imaging services through our trusted partners.
          Compare prices, find convenient locations, and schedule your appointments with ease.
        </Animated.Text>

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

        <Animated.View style={styles.warningCard} entering={FadeInUp.delay(700)}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={24} color={colors.status.warning} />
            <Text style={styles.warningTitle}>Important Notice</Text>
          </View>
          <Text style={styles.warningText}>
            Please be advised that due to the Eliminating Kickbacks in Recovery Act (EKRA),
            certain laboratory costs exceeding your Initial Unshareable Amount (IUA) may not
            be eligible for reimbursement through healthsharing plans.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },

  header: {
    backgroundColor: colors.background.default,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  headerContent: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { ...typography.h3, fontWeight: '600', color: colors.text.primary },
  title: { ...typography.h2, fontWeight: '700', color: colors.text.primary, marginLeft: spacing.sm },

  content: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  description: {
    ...typography.body1,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },

  servicesGrid: { gap: spacing.md, marginBottom: spacing.xl },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    ...shadows.md,
    shadowColor: colors.primary.main,
  },
  serviceContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm },

  iconContainer: {
    width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  textContainer: { flex: 1 },
  serviceTitle: { ...typography.h4, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs / 2 },
  serviceDescription: { ...typography.body2, fontWeight: '400', color: colors.text.secondary, lineHeight: 20 },

  chevronContainer: { width: 36, height: 36, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },

  warningCard: { backgroundColor: rgbaFromHex(colors.status.warning, 0.08), borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: spacing.xxl },
  warningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, columnGap: spacing.sm as unknown as number },
  warningTitle: { ...typography.h4, fontWeight: '600', color: colors.status.warning },
  warningText: { ...typography.body2, fontWeight: '400', color: colors.status.warning, lineHeight: 20 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.md,
  },
  retryButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.background.default,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
