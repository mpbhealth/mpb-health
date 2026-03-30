import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Heart,
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
import { ProviderSearchWebView, isMultiplanProviderSearchUrl } from '@/components/common/ProviderSearchWebView';
import { SmartText } from '@/components/common/SmartText';
import { EmptyState } from '@/components/common/EmptyState';
import { useCareServices, type CareService } from '@/hooks/useCareServices';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { colors } from '@/constants/theme';
import { responsiveSize, moderateScale } from '@/utils/scaling';
import {
  hubScreenHeader,
  hubHeaderA11y,
  hubScreenScroll,
  hubListRow,
  hubScreenStates,
} from '@/utils/hubListScreenLayout';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserData } from '@/hooks/useUserData';
import { screenChrome } from '@/utils/screenChrome';

/** Hosts that block or restrict in-app WebViews; WebViewContainer opens them in the system browser. */
const OPEN_IN_BROWSER_HOSTS: RegExp[] = [/zocdoc\.com/i];

export default function CareScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();
  const { userData } = useUserData();
  // Match both normalized and raw product_id so care_services rows with 47182 or 42464 both show for members with product_id 47182
  const normalizedPid = userData?.normalized_product_id ?? userData?.product_id ?? null;
  const rawPid = userData?.product_id ?? null;
  const userProductIds = [normalizedPid, rawPid].filter(Boolean) as string[];
  const userProductIdList = userProductIds.length > 0 ? Array.from(new Set(userProductIds)) : null;
  const { services, loading, error, refetch } = useCareServices(userProductIdList);
  const [selectedService, setSelectedService] = useState<CareService | null>(null);
  const [webViewError, setWebViewError] = useState(false);
  const headerStyle = [hubScreenHeader.bar, { paddingTop: headerPaddingTop }];

  if (selectedService) {
    const isBluebook = selectedService.serviceKey === 'bluebook';
    const isMultiplanProviderSearch = isMultiplanProviderSearchUrl(selectedService.url);

    return (
      <Animated.View
        style={screenChrome.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={headerStyle}>
          <BackButton onPress={() => {
            setSelectedService(null);
            setWebViewError(false);
          }} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h3" style={hubScreenHeader.detailTitle} {...hubHeaderA11y.detailTitle}>
              {selectedService.title}
            </SmartText>
          </View>
        </View>

        {webViewError ? (
          <View style={hubScreenStates.errorContainer}>
            <AlertCircle size={moderateScale(48)} color={colors.status.error} />
            <SmartText variant="h3" style={hubScreenStates.errorTitle}>Unable to Load Service</SmartText>
            <SmartText variant="body2" style={hubScreenStates.errorText}>
              This service is temporarily unavailable. Please try again later or contact support.
            </SmartText>
            <TouchableOpacity
              style={hubScreenStates.retryButton}
              onPress={() => setWebViewError(false)}
            >
              <RefreshCw size={moderateScale(20)} color={colors.background.default} />
              <SmartText variant="body1" style={hubScreenStates.retryButtonText}>Try Again</SmartText>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {isBluebook ? (
              <BluebookWebView
                url={selectedService.url}
                email={userData?.email}
              />
            ) : isMultiplanProviderSearch ? (
              <ProviderSearchWebView url={selectedService.url} />
            ) : (
              <WebViewContainer
                url={selectedService.url}
                highSecurity
                openInBrowserHosts={OPEN_IN_BROWSER_HOSTS}
                openInBrowserAutoOpen
              />
            )}
          </React.Fragment>
        )}
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
              Care Services
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
              Care Services
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
              Care Services
            </SmartText>
          </View>
        </Animated.View>
        <EmptyState
          icon={<Heart size={moderateScale(48)} color={colors.gray[300]} />}
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
            Care Services
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
              Find PHCS Specific Services network providers, facilities and procedure costs, and schedule appointments online.
            </SmartText>
          </Animated.View>

          <View style={styles.servicesGrid}>
            {services.map((service, index) => {
              const ServiceIcon = service.icon;
              return (
                <Animated.View
                  key={service.id}
                  entering={FadeInUp.delay(300 + index * 100)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    style={hubListRow.card}
                    onPress={() => setSelectedService(service)}
                    activeOpacity={0.9}
                    accessibilityLabel={`Open ${service.title}`}
                    accessibilityRole="button"
                  >
                    <View style={hubListRow.rowInner}>
                      <View
                        style={[hubListRow.iconTile, { backgroundColor: service.gradient }]}
                      >
                        <ServiceIcon size={moderateScale(24)} color={service.color} />
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
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  servicesGrid: {
    gap: responsiveSize.md,
  },
});
