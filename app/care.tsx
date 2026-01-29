import React, { useState } from 'react';
import {
  View,
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
import { SmartText } from '@/components/common/SmartText';
import { useCareServices, type CareService } from '@/hooks/useCareServices';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserData } from '@/hooks/useUserData';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CareScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const { userData } = useUserData();
  const { services, loading, error, refetch } = useCareServices();
  const [selectedService, setSelectedService] = useState<CareService | null>(null);
  const [webViewError, setWebViewError] = useState(false);

  if (selectedService) {
    const isBluebook = selectedService.serviceKey === 'bluebook';

    return (
      <Animated.View
        style={styles.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={styles.header}>
          <BackButton onPress={() => {
            setSelectedService(null);
            setWebViewError(false);
          }} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>{selectedService.title}</SmartText>
          </View>
        </View>

        {webViewError ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={moderateScale(48)} color={colors.status.error} />
            <SmartText variant="h3" style={styles.errorTitle}>Unable to Load Service</SmartText>
            <SmartText variant="body2" style={styles.errorText}>
              This service is temporarily unavailable. Please try again later or contact support.
            </SmartText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setWebViewError(false)}
            >
              <RefreshCw size={moderateScale(20)} color={colors.background.default} />
              <SmartText variant="body1" style={styles.retryButtonText}>Try Again</SmartText>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {isBluebook ? (
              Platform.OS === 'android' ? (
                <WebViewContainer url={selectedService.url} />
              ) : (
                <BluebookWebView
                  url={selectedService.url}
                  email={userData?.email}
                />
              )
            ) : (
              <WebViewContainer url={selectedService.url} />
            )}
          </React.Fragment>
        )}
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>Care Services</SmartText>
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
          <SmartText variant="h2" style={styles.title}>Care Services</SmartText>
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
          <SmartText variant="h2" style={styles.title}>Care Services</SmartText>
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
        <SmartText variant="h2" style={styles.title}>Care Services</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={styles.description}>
              Access telehealth, mental health, healthcare resources, and wellness tools all
              in one convenient location.
            </SmartText>
          </Animated.View>

          <View style={styles.servicesGrid}>
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
                      <ServiceIcon size={moderateScale(26)} color={service.color} />
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
                  <ExternalLink size={moderateScale(18)} color={service.color} />
                </AnimatedTouchableOpacity>
              );
            })}
          </View>
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

  servicesGrid: {
    gap: responsiveSize.md,
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
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.sm,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  serviceTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  serviceDescription: {
    color: colors.text.secondary,
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
