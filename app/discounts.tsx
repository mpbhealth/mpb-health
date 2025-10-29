import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useDiscountServices, type DiscountService } from '@/hooks/useDiscountServices';
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';
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

          {service.codes && service.codes.length > 0 && (
            <View style={styles.codesContainer}>
              <Text style={styles.codesHeader}>Member Discount Codes:</Text>
              {service.codes.map((codeItem, i) => (
                <View key={`${service.id}-code-${i}`} style={styles.codeRow}>
                  <View style={[styles.codeChip, { backgroundColor: service.color }]}>
                    <Text style={styles.codeText}>{codeItem.code}</Text>
                  </View>
                  <Text style={styles.codeDescription}>{codeItem.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.chevronContainer, { backgroundColor: service.gradient }]}>
        <ExternalLink size={20} color={service.color} />
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function DiscountsScreen() {
  const router = useRouter();
  const { services, loading, error, refetch } = useDiscountServices();
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  if (selectedUrl) {
    return (
      <Animated.View style={styles.container} entering={SlideInRight} exiting={SlideOutLeft}>
        <View style={styles.header}>
          <BackButton onPress={() => setSelectedUrl(null)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Discounts</Text>
          </View>
        </View>
        <WebViewContainer url={selectedUrl} />
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title}>Discounts</Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading discounts...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title}>Discounts</Text>
        </Animated.View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.status.error} />
          <Text style={styles.errorTitle}>Unable to Load Discounts</Text>
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
          <Text style={styles.title}>Discounts</Text>
        </Animated.View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No discounts available at this time</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Discounts</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.Text style={styles.description} entering={FadeInUp.delay(200)}>
          Save on prescriptions, supplements, and medical services with exclusive member discounts and special pricing.
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

        <Animated.View style={styles.supportCard} entering={FadeInUp.delay(700)}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => router.push('/(tabs)/chat' as never)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Contact Concierge for help finding discounts"
          >
            <View style={styles.supportContent}>
              <Text style={styles.supportButtonText}>Need help finding discounts?</Text>
              <Text style={styles.supportSubtext}>Contact our Concierge team for assistance</Text>
            </View>
            <View
              style={[
                styles.supportChevron,
                { backgroundColor: rgbaFromHex(colors.primary.main, 0.15) },
              ]}
            >
              <ExternalLink size={18} color={colors.primary.main} />
            </View>
          </TouchableOpacity>
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
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text.primary,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },

  content: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  description: {
    ...typography.body1,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },

  servicesGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'column',
    ...shadows.md,
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    minWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  textContainer: { flex: 1, minWidth: 0 },
  serviceTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  serviceDescription: {
    ...typography.body2,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },

  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },

  // Codes box
  codesContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: rgbaFromHex(colors.primary.dark, 0.08),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: rgbaFromHex(colors.primary.dark, 0.12),
  },
  codesHeader: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary.dark,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  codeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    flexShrink: 0,
  },
  codeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.background.default,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  codeDescription: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
    minWidth: 0,
  },

  // Support CTA
  supportCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    overflow: 'hidden',
  },
  supportButton: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportContent: { flex: 1, marginRight: spacing.sm, minWidth: 0 },
  supportButtonText: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  supportSubtext: {
    ...typography.body2,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  supportChevron: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

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
