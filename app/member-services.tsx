import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import {
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useUserData } from '@/hooks/useUserData';
import { useMemberForms, type MemberForm } from '@/hooks/useMemberForms';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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
  const { isTablet } = useResponsive();
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
        style={styles.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={styles.header}>
          <BackButton onPress={() => setSelectedService(null)} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Member Forms</SmartText>
          </View>
        </View>

        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <WebViewContainer
            url={selectedService.url}
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
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>Member Forms</SmartText>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={styles.loadingText}>Loading forms...</SmartText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>Member Forms</SmartText>
        </Animated.View>
        <View style={styles.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={styles.errorTitle}>Unable to Load Forms</SmartText>
          <SmartText variant="body2" style={styles.errorText}>{error}</SmartText>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <RefreshCw size={moderateScale(20)} color={colors.background.default} />
            <SmartText variant="body1" style={styles.retryButtonText}>Retry</SmartText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (forms.length === 0) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <SmartText variant="h2" style={styles.title}>Member Forms</SmartText>
        </Animated.View>
        <View style={styles.emptyContainer}>
          <SmartText variant="body1" style={styles.emptyText}>No forms available at this time</SmartText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>Member Forms</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + responsiveSize.xl }]}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={styles.description}>
              Manage your membership and access self-service options
            </SmartText>
          </Animated.View>

          <View style={isTablet ? styles.gridContainer : undefined}>
            {forms.map((form, index) => {
              const FormIcon = form.icon;
              return (
                <AnimatedTouchableOpacity
                  key={form.id}
                  style={[styles.serviceCard, isTablet && styles.serviceCardWide]}
                  onPress={() => setSelectedService(form)}
                  entering={FadeInUp.delay(300 + index * 100)}
                  layout={Layout.springify()}
                  activeOpacity={0.9}
                >
                  <View style={styles.serviceContent}>
                    <View style={[styles.iconContainer, { backgroundColor: form.gradient }]}>
                      <FormIcon size={moderateScale(24)} color={form.color} />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <SmartText variant="body1" style={styles.serviceTitle}>
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
                      <SmartText variant="body2" style={styles.serviceDescription}>
                        {form.description}
                      </SmartText>
                    </View>
                  </View>
                  <ExternalLink size={moderateScale(18)} color={form.color} />
                </AnimatedTouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
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
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSize.md,
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

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.md,
    marginBottom: responsiveSize.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },
  serviceCardWide: {
    width: '48%',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: responsiveSize.xs / 2,
  },
  serviceTitle: {
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  serviceDescription: {
    color: colors.text.secondary,
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
    alignItems: 'center',
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
