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
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { useUserData } from '@/hooks/useUserData';
import { useMemberForms, type MemberForm } from '@/hooks/useMemberForms';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale } from '@/utils/scaling';
import {
  hubScreenHeader,
  hubHeaderA11y,
  hubScreenScroll,
  hubListRow,
  hubScreenStates,
} from '@/utils/hubListScreenLayout';
import { useResponsive } from '@/hooks/useResponsive';
import { screenChrome } from '@/utils/screenChrome';

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MemberServicesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();
  const headerStyle = [hubScreenHeader.bar, { paddingTop: headerPaddingTop }];
  const { userData } = useUserData();
  const { forms, loading, error, refetch } = useMemberForms();

  const [selectedService, setSelectedService] = useState<MemberForm | null>(null);

  // Disable swipe gesture when WebView is open
  useEffect(() => {
    if (selectedService) {
      navigation.setOptions({
        gestureEnabled: false,
      });
    } else {
      navigation.setOptions({
        gestureEnabled: true,
      });
    }
  }, [selectedService, navigation]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedService) {
        setSelectedService(null);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [selectedService]);

  if (selectedService) {
    const isSchedReq = selectedService.url.includes('RequestToScheduleAnAppointment');

    return (
      <Animated.View
        style={screenChrome.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={headerStyle}>
          <BackButton onPress={() => setSelectedService(null)} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h3" style={hubScreenHeader.detailTitle} {...hubHeaderA11y.detailTitle}>
              {selectedService.title}
            </SmartText>
          </View>
        </View>

        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <WebViewContainer
            url={selectedService.url}
            highSecurity
            {...(isSchedReq && {
              injectedJavaScript: `
                (function() {
                  function fillFormFields() {
                    const userData = {
                      firstName: ${JSON.stringify(userData?.first_name || '')},
                      lastName: ${JSON.stringify(userData?.last_name || '')},
                      email: ${JSON.stringify(userData?.email || '')}
                    };

                    const fieldSelectors = {
                      firstName: [
                        'input[name*="first" i][name*="name" i]',
                        'input[name*="fname" i]',
                        'input[placeholder*="first" i][placeholder*="name" i]',
                        'input[id*="first" i][id*="name" i]',
                        'input[data-field*="first" i]'
                      ],
                      lastName: [
                        'input[name*="last" i][name*="name" i]',
                        'input[name*="lname" i]',
                        'input[placeholder*="last" i][placeholder*="name" i]',
                        'input[id*="last" i][id*="name" i]',
                        'input[data-field*="last" i]'
                      ],
                      email: [
                        'input[type="email"]',
                        'input[name*="email" i]',
                        'input[placeholder*="email" i]',
                        'input[id*="email" i]',
                        'input[data-field*="email" i]'
                      ]
                    };

                    function findAndFillField(selectors, value) {
                      if (!value) return false;
                      for (const selector of selectors) {
                        const field = document.querySelector(selector);
                        if (field && field.type !== 'hidden') {
                          field.value = value;
                          field.dispatchEvent(new Event('input', { bubbles: true }));
                          field.dispatchEvent(new Event('change', { bubbles: true }));
                          field.dispatchEvent(new Event('blur', { bubbles: true }));
                          return true;
                        }
                      }
                      return false;
                    }

                    const results = {
                      firstName: findAndFillField(fieldSelectors.firstName, userData.firstName),
                      lastName: findAndFillField(fieldSelectors.lastName, userData.lastName),
                      email: findAndFillField(fieldSelectors.email, userData.email)
                    };

                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'AUTO_FILL_COMPLETE',
                        results: results
                      }));
                    }
                  }

                  function waitForFormAndFill() {
                    const maxAttempts = 20;
                    let attempts = 0;
                    const checkAndFill = () => {
                      attempts++;
                      const hasForm = document.querySelector('form') || document.querySelector('input');
                      if (hasForm || attempts >= maxAttempts) {
                        setTimeout(fillFormFields, 500);
                      } else {
                        setTimeout(checkAndFill, 250);
                      }
                    };
                    checkAndFill();
                  }

                  if (document.readyState === 'complete') {
                    waitForFormAndFill();
                  } else {
                    window.addEventListener('load', waitForFormAndFill);
                  }
                })();
                true;
              `,
              onMessage: (event: any) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'AUTO_FILL_COMPLETE') {
                    // noop
                  }
                } catch {}
              },
            })}
          />
        </View>
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
              Member Forms
            </SmartText>
          </View>
        </Animated.View>
        <View style={hubScreenStates.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={hubScreenStates.loadingText}>Loading forms...</SmartText>
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
              Member Forms
            </SmartText>
          </View>
        </Animated.View>
        <View style={hubScreenStates.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={hubScreenStates.errorTitle}>Unable to Load Forms</SmartText>
          <SmartText variant="body2" style={hubScreenStates.errorText}>{error}</SmartText>
          <TouchableOpacity style={hubScreenStates.retryButton} onPress={refetch}>
            <RefreshCw size={moderateScale(20)} color={colors.background.default} />
            <SmartText variant="body1" style={hubScreenStates.retryButtonText}>Retry</SmartText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (forms.length === 0) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
              Member Forms
            </SmartText>
          </View>
        </Animated.View>
        <EmptyState
          icon={<FileText size={moderateScale(48)} color={colors.gray[300]} />}
          message="No forms available at this time"
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
            Member Forms
          </SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={[hubScreenScroll.content, hubScreenScroll.contentShade]}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[screenChrome.scrollContent, hubScreenScroll.scrollPad, { paddingBottom: scrollContentPaddingBottom + responsiveSize.lg }]}
      >
        <View style={[hubScreenScroll.maxWidthContainer, isTablet && hubScreenScroll.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={hubScreenScroll.description}>
              Choose a form to open it in the app. Use the same links for scheduling, member updates, and other self-service tasks.
            </SmartText>
          </Animated.View>

          <View style={isTablet ? styles.gridContainer : styles.formList}>
            {forms.map((form, index) => {
              const FormIcon = form.icon;
              return (
                <Animated.View
                  key={form.id}
                  entering={FadeInUp.delay(300 + index * 100)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    style={[hubListRow.card, isTablet && styles.serviceCardWide]}
                    onPress={() => setSelectedService(form)}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${form.title}`}
                  >
                    <View style={hubListRow.rowInner}>
                      <View style={[hubListRow.iconTile, { backgroundColor: form.gradient }]}>
                        <FormIcon size={moderateScale(22)} color={form.color} />
                      </View>
                      <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                          <SmartText
                            variant="body1"
                            style={[hubListRow.rowTitle, styles.serviceTitleFlex]}
                          >
                            {form.title}
                          </SmartText>
                          {form.badge && (
                            <View style={[styles.badge, { backgroundColor: form.gradient }]}>
                              <SmartText variant="caption" style={[styles.badgeText, { color: form.color }]}>
                                {form.badge}
                              </SmartText>
                            </View>
                          )}
                        </View>
                        <SmartText variant="body2" style={hubListRow.rowDescription}>
                          {form.description}
                        </SmartText>
                      </View>
                    </View>
                    <View style={[hubListRow.openHint, { borderWidth: 0, backgroundColor: form.gradient }]}>
                      <ExternalLink size={moderateScale(18)} color={form.color} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View
            entering={FadeInUp.delay(400 + forms.length * 100)}
          >
            <Card padding="md" variant="outlined" style={styles.supportCard}>
              <AlertCircle size={moderateScale(22)} color={colors.status.info} style={{ marginRight: responsiveSize.sm }} />
              <View style={styles.supportContent}>
                <SmartText variant="body1" style={styles.supportTitle}>Support Hours</SmartText>
                <SmartText variant="body2" style={styles.supportText}>Mon – Fri, 9:00 AM – 5:00 PM EST</SmartText>
              </View>
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  formList: {
    gap: responsiveSize.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: responsiveSize.md,
  },

  serviceCardWide: {
    width: '48%',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: responsiveSize.xs / 2,
  },
  serviceTitleFlex: {
    flex: 1,
    minWidth: 0,
  },

  badge: {
    paddingHorizontal: responsiveSize.sm,
    paddingVertical: responsiveSize.xs / 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontWeight: '600',
  },

  supportCard: {
    backgroundColor: rgbaFromHex(colors.status.info, 0.08),
    borderColor: rgbaFromHex(colors.status.info, 0.2),
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: responsiveSize.md,
    marginBottom: responsiveSize.lg,
  },
  supportContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 4,
  },
  supportTitle: {
    fontWeight: '600',
    color: colors.status.info,
  },
  supportText: {
    color: colors.status.info,
    lineHeight: 20,
  },

});
