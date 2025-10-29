import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { useUserData } from '@/hooks/useUserData';
import { useMemberForms, type MemberForm } from '@/hooks/useMemberForms';
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function MemberServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const { userData } = useUserData();
  const { forms, loading, error, refetch } = useMemberForms();

  const [selectedService, setSelectedService] = useState<MemberForm | null>(null);

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
            <Text style={styles.headerTitle}>Member Forms</Text>
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
          <Text style={styles.title}>Member Forms</Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.title}>Member Forms</Text>
        </Animated.View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.status.error} />
          <Text style={styles.errorTitle}>Unable to Load Forms</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <RefreshCw size={20} color={colors.background.default} />
            <Text style={styles.retryButtonText}>Retry</Text>
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
          <Text style={styles.title}>Member Forms</Text>
        </Animated.View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No forms available at this time</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Member Forms</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        <Animated.Text style={styles.description} entering={FadeInUp.delay(200)}>
          Manage your membership and access self-service options
        </Animated.Text>

        <View style={isWide ? styles.gridContainer : undefined}>
          {forms.map((form, index) => {
            const FormIcon = form.icon;
            return (
              <AnimatedTouchableOpacity
                key={form.id}
                style={[styles.serviceCard, isWide && styles.serviceCardWide]}
                onPress={() => setSelectedService(form)}
                entering={FadeInUp.delay(300 + index * 100)}
                layout={Layout.springify()}
                activeOpacity={0.9}
              >
                <View style={styles.serviceContent}>
                  <View style={[styles.iconContainer, { backgroundColor: form.gradient }]}>
                    <FormIcon size={24} color={form.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                      <Text style={styles.serviceTitle} numberOfLines={1}>
                        {form.title}
                      </Text>
                      {form.badge && (
                        <View style={[styles.badge, { backgroundColor: form.gradient }]}>
                          <Text style={[styles.badgeText, { color: form.color }]}>
                            {form.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.serviceDescription}>{form.description}</Text>
                  </View>
                </View>
                <ExternalLink size={20} color={form.color} />
              </AnimatedTouchableOpacity>
            );
          })}
        </View>

        <Animated.View
          style={styles.supportCard}
          entering={FadeInUp.delay(400 + forms.length * 100)}
        >
          <AlertCircle size={24} color={colors.status.info} style={{ marginRight: spacing.sm }} />
          <View style={styles.supportContent}>
            <Text style={styles.supportTitle}>Support Hours</Text>
            <Text style={styles.supportText}>Mon – Fri, 9:00 AM – 8:00 PM EST</Text>
          </View>
        </Animated.View>
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
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '600',
    color: colors.text.primary,
  },
  title: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  description: {
    fontSize: typography.body1.fontSize,
    lineHeight: typography.body1.lineHeight,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  serviceCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    ...shadows.sm,
  },
  serviceCardWide: {
    width: '48%',
    marginBottom: spacing.md,
  },
  serviceContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    minWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs / 2,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  serviceTitle: {
    fontSize: typography.h4.fontSize,
    lineHeight: typography.h4.lineHeight,
    fontWeight: '600',
    color: colors.text.primary,
    flexShrink: 1,
  },
  serviceDescription: {
    fontSize: typography.body2.fontSize,
    lineHeight: 20,
    color: colors.text.secondary,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: '600',
  },

  supportCard: {
    backgroundColor: `${colors.status.info}08`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportContent: {
    flex: 1,
    minWidth: 0,
  },
  supportTitle: {
    fontSize: typography.body1.fontSize,
    lineHeight: typography.body1.lineHeight,
    fontWeight: '600',
    color: colors.status.info,
    marginBottom: spacing.xs / 2,
  },
  supportText: {
    fontSize: typography.body2.fontSize,
    lineHeight: typography.body2.lineHeight,
    color: colors.status.info,
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
