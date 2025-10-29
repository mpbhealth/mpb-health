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
import {
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import BluebookWebView from '@/components/common/BluebookWebView';
import { useCareServices, type CareService } from '@/hooks/useCareServices';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useUserData } from '@/hooks/useUserData';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CareScreen() {
  const router = useRouter();
  const { userData } = useUserData();
  const { services, loading, error, refetch } = useCareServices();
  const [selectedService, setSelectedService] = useState<CareService | null>(null);

  if (selectedService) {
    const isBluebook = selectedService.serviceKey === 'bluebook';

    return (
      <Animated.View
        style={styles.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={styles.header}>
          <BackButton onPress={() => setSelectedService(null)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{selectedService.title}</Text>
          </View>
        </View>

        {isBluebook ? (
          <BluebookWebView
            url={selectedService.url}
            email={userData?.email}
          />
        ) : (
          <WebViewContainer url={selectedService.url} />
        )}
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title}>Care Services</Text>
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
          <Text style={styles.title}>Care Services</Text>
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
          <Text style={styles.title}>Care Services</Text>
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
        <Text style={styles.title}>Care Services</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text style={styles.description} entering={FadeInUp.delay(200)}>
          Access telehealth, mental health, healthcare resources, and wellness tools all
          in one convenient location.
        </Animated.Text>

        {services.map((service, index) => {
          const ServiceIcon = service.icon;
          return (
            <AnimatedTouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => setSelectedService(service)}
              activeOpacity={0.9}
              entering={FadeInUp.delay(300 + index * 100)}
              layout={Layout.springify()}
              accessibilityLabel={`Open ${service.title}`}
              accessibilityRole="button"
            >
              <View style={styles.serviceContent}>
                <View
                  style={[styles.iconContainer, { backgroundColor: service.gradient }]}
                >
                  <ServiceIcon size={24} color={service.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle} numberOfLines={1} ellipsizeMode="tail">
                    {service.title}
                  </Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
              </View>
              <ExternalLink size={20} color={service.color} />
            </AnimatedTouchableOpacity>
          );
        })}
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
    ...shadows.sm,
  },
  headerContent: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { ...typography.h3, fontWeight: '600', color: colors.text.primary },
  title: { ...typography.h2, fontWeight: '700', color: colors.text.primary, marginLeft: spacing.sm },

  content: { flex: 1, padding: spacing.lg },

  description: {
    ...typography.body1,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: { flex: 1, minWidth: 0 },
  serviceTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceDescription: { ...typography.body2, fontWeight: '400', color: colors.text.secondary },

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
