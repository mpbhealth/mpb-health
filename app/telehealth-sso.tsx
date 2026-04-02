import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stethoscope, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { BackButton } from '@/components/common/BackButton';
import { TelehealthWebView, TelehealthWebViewRef } from '@/components/telehealth/TelehealthWebView';
import { TelehealthLoadingPanel } from '@/components/telehealth/TelehealthLoadingPanel';
import { TELEHEALTH_LOADING } from '@/components/telehealth/telehealthLoadingCopy';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { platformStyles, cardChromeLg } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const TELEHEALTH_KEEP_AWAKE_TAG = 'mpb-telehealth-portal';

export default function TelehealthSSOScreen() {
  const router = useRouter();
  const { redirectId } = useLocalSearchParams<{ redirectId?: string }>();
  const { headerPaddingTop } = useSafeHeaderPadding();
  const { userData, loading: userLoading } = useUserData();
  const { session } = useAuth();
  const headerStyle = [styles.header, { paddingTop: headerPaddingTop }];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMemberNotFound, setShowMemberNotFound] = useState(false);
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [initialSsoUrl, setInitialSsoUrl] = useState<string | null>(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [hasUnsavedFormData, setHasUnsavedFormData] = useState(false);
  const [showFuturePlanModal, setShowFuturePlanModal] = useState(false);
  const [planStartDate, setPlanStartDate] = useState<string | null>(null);
  const telehealthWebViewRef = React.useRef<TelehealthWebViewRef>(null);

  /**
   * Start SSO only when opening the portal. Do NOT re-run when `session` or `userData`
   * refresh (e.g. Supabase TOKEN_REFRESHED) while the WebView is open — that would fetch a
   * new SSO URL, change `source.uri`, and reload the portal (members lose form progress).
   */
  useEffect(() => {
    if (!userLoading && userData && session) {
      if (ssoUrl || isLoading) {
        return;
      }
      checkPlanActivation();
    }
  }, [userLoading, userData, session, ssoUrl, isLoading]);

  /** Long intake forms: avoid the display sleep mid-visit (especially on iOS). */
  useEffect(() => {
    if (!ssoUrl) return;
    void activateKeepAwakeAsync(TELEHEALTH_KEEP_AWAKE_TAG);
    return () => {
      void deactivateKeepAwake(TELEHEALTH_KEEP_AWAKE_TAG);
    };
  }, [ssoUrl]);

  const checkPlanActivation = () => {
    if (!userData?.active_date) {
      initiateSSO();
      return;
    }

    const activeDateObj = new Date(userData.active_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    activeDateObj.setHours(0, 0, 0, 0);

    if (activeDateObj > today) {
      setPlanStartDate(userData.active_date);
      setShowFuturePlanModal(true);
    } else {
      initiateSSO();
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const checkNetworkConnectivity = async (): Promise<boolean> => {
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      return response.status === 200 || response.status === 401 || response.status === 404;
    } catch {
      return false;
    }
  };

  const makeSSORequest = async (
    apiUrl: string,
    headers: Record<string, string>,
    body: string,
    attempt: number = 0
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeout = attempt === 0 ? 30000 : 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < MAX_RETRY_ATTEMPTS - 1) {
        const isConnected = await checkNetworkConnectivity();

        if (!isConnected) {
          throw new Error('NO_NETWORK');
        }

        const delayMs = RETRY_DELAYS[attempt];
        setRetryMessage(`Connection issue detected. Retrying in ${delayMs / 1000} seconds...`);
        await delay(delayMs);
        setRetryMessage(null);

        return makeSSORequest(apiUrl, headers, body, attempt + 1);
      }

      throw err;
    }
  };

  const initiateSSO = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowMemberNotFound(false);
      setRetryMessage(null);

      if (!session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      if (!userData?.member_id) {
        throw new Error('Member ID not found. Please contact support.');
      }

      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        throw new Error('Service configuration error. Please contact support.');
      }

      if (!anonKey) {
        throw new Error('Service authentication configuration error. Please contact support.');
      }

      console.log('Initiating MyTelemedicine SSO for member:', userData.member_id);

      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('NO_NETWORK');
      }

      const apiUrl = `${supabaseUrl}/functions/v1/mytelemedicine-sso`;

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const body = JSON.stringify({
        member_id: userData.member_id,
        redirect_id: redirectId
      });

      console.log('Making SSO request to Edge Function...');

      const response = await makeSSORequest(apiUrl, headers, body);

      let responseData;
      try {
        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }

        responseData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse response:', parseErr);
        throw new Error('Invalid response from telehealth service. Please try again.');
      }

      if (!response.ok) {
        // Check if member not found
        if (
          responseData?.memberNotFound ||
          response.status === 404 ||
          responseData?.error?.toLowerCase().includes('member not found')
        ) {
          console.log('Member not found in telehealth system');
          setShowMemberNotFound(true);
          return;
        }

        if (response.status >= 500) {
          throw new Error('Telehealth service is temporarily unavailable. Please try again in a few minutes.');
        }

        throw new Error(responseData?.error || 'Failed to generate SSO access');
      }

      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format from telehealth service');
      }

      if (!responseData.success || !responseData.ssoUrl) {
        throw new Error('Incomplete response from SSO service. Please try again.');
      }

      if (typeof responseData.ssoUrl !== 'string' || !responseData.ssoUrl.startsWith('http')) {
        throw new Error('Invalid SSO URL received. Please contact support.');
      }

      console.log('SSO URL generated successfully');
      setSsoUrl(responseData.ssoUrl);
      if (!initialSsoUrl) {
        setInitialSsoUrl(responseData.ssoUrl);
      }
      setRetryCount(0);

    } catch (err) {
      console.error('MyTelemedicine SSO error:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof Error) {
        if (err.message === 'NO_NETWORK') {
          errorMessage = 'No internet connection detected. Please check your network and try again.';
        } else if (err.name === 'AbortError') {
          errorMessage = 'Connection timed out. Please check your internet connection and try again.';
        } else if (err.message.includes('Network request failed')) {
          errorMessage = 'Unable to reach telehealth services. Please check your connection and try again.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Invalid response from server. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      if (errorMessage.includes('Failed to generate telehealth access')) {
        setError('TELEHEALTH_ACTIVATION_PENDING');
      } else {
        setError(errorMessage);
      }

      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
      setRetryMessage(null);
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowMemberNotFound(false);
    initiateSSO();
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ssoUrl) {
        handleBackPress();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [ssoUrl, webViewCanGoBack, hasUnsavedFormData]);

  const goBackInsideWebView = () => {
    telehealthWebViewRef.current?.goBackInWebView();
  };

  const handleBackPress = () => {
    if (webViewCanGoBack) {
      if (hasUnsavedFormData) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved form data. Are you sure you want to go back?',
          [
            { text: 'Stay', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: goBackInsideWebView,
            },
          ],
        );
        return;
      }
      if (telehealthWebViewRef.current?.goBackInWebView) {
        goBackInsideWebView();
        return;
      }
    }

    const message = hasUnsavedFormData
      ? 'You have unsaved form data. Are you sure you want to exit the telehealth portal?'
      : 'Are you sure you want to exit the telehealth portal?';

    Alert.alert(
      'Exit Telehealth',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            setSsoUrl(null);
            setInitialSsoUrl(null);
            router.back();
          }
        }
      ]
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    setWebViewCanGoBack(navState.canGoBack);
  };

  const handleFormStateChange = (hasUnsavedData: boolean) => {
    setHasUnsavedFormData(hasUnsavedData);
  };

  const handleFormSubmitSuccess = () => {
    setHasUnsavedFormData(false);
  };

  const handleSessionExpired = () => {
    setSsoUrl(null);
    setError('Your session has expired. Please try again.');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleScheduleCall = () => {
    router.push('/member-services');
  };

  if (userLoading) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <Stethoscope size={24} color={colors.primary.main} />
            <Text style={styles.headerTitle}>Telehealth Portal</Text>
          </View>
        </Animated.View>
        <View style={styles.contentLoadingRoot}>
          <Animated.View style={styles.loadingImmersive} entering={FadeInUp.delay(200)}>
            <TelehealthLoadingPanel variant="immersive" subtitle={TELEHEALTH_LOADING.subtitleUser} />
          </Animated.View>
        </View>
      </View>
    );
  }

  if (showFuturePlanModal && planStartDate) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <Stethoscope size={24} color={colors.primary.main} />
            <Text style={styles.headerTitle}>Telehealth Portal</Text>
          </View>
        </Animated.View>

        <View style={styles.content}>
          <Animated.View style={styles.futurePlanContainer} entering={FadeInUp.delay(200)}>
            <View style={styles.futurePlanCard}>
              <Stethoscope size={48} color={colors.primary.main} style={styles.futurePlanIcon} />
              <Text style={styles.futurePlanTitle}>Telehealth Coming Soon</Text>
              <Text style={styles.futurePlanDate}>{formatDate(planStartDate)}</Text>
              <Text style={styles.futurePlanText}>
                Your telehealth access will be available starting {formatDate(planStartDate)} when your plan becomes active.
              </Text>
              <Text style={styles.futurePlanSubtext}>
                In the meantime, schedule a welcome call with our team to learn about your benefits.
              </Text>

              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={handleScheduleCall}
                activeOpacity={0.8}
              >
                <Text style={styles.scheduleButtonText}>Schedule Welcome Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  if (ssoUrl) {
    return (
      <View style={screenChrome.container}>
        <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
          <BackButton onPress={handleBackPress} />
          <View style={styles.headerContent}>
            <Stethoscope size={24} color={colors.primary.main} />
            <Text style={styles.headerTitle}>Telehealth Portal</Text>
          </View>
        </Animated.View>

        <View style={styles.webviewContainer}>
          <TelehealthWebView
            ref={telehealthWebViewRef}
            url={ssoUrl}
            initialUrl={initialSsoUrl || undefined}
            memberId={userData?.member_id || ''}
            loadingSubtitle={TELEHEALTH_LOADING.subtitleWebView}
            onNavigationStateChange={handleNavigationStateChange}
            onFormStateChange={handleFormStateChange}
            onFormSubmitSuccess={handleFormSubmitSuccess}
            onSessionExpired={handleSessionExpired}
            onError={(error) => {
              console.error('TelehealthWebView error:', error);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={screenChrome.container}>
      <Animated.View style={headerStyle} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <Stethoscope size={24} color={colors.primary.main} />
          <Text style={styles.headerTitle}>Telehealth Portal</Text>
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={styles.contentLoadingRoot}>
          <Animated.View style={styles.loadingImmersive} entering={FadeInUp.delay(200)}>
            <TelehealthLoadingPanel
              variant="immersive"
              subtitle={retryMessage || TELEHEALTH_LOADING.subtitleSso}
              hint={
                retryCount > 0 ? `Attempt ${retryCount + 1} of ${MAX_RETRY_ATTEMPTS}` : null
              }
            />
          </Animated.View>
        </View>
      ) : (
        <View style={styles.content}>
          {showMemberNotFound ? (
            <Animated.View style={styles.memberNotFoundContainer} entering={FadeInUp.delay(200)}>
              <View style={styles.memberNotFoundCard}>
                <AlertCircle size={48} color={colors.status.warning} style={styles.memberNotFoundIcon} />
                <Text style={styles.memberNotFoundTitle}>Member Not Found</Text>
                <Text style={styles.memberNotFoundText}>
                  Your membership could not be found in the telehealth system. Our Concierge team can help resolve this issue.
                </Text>

                <TouchableOpacity
                  style={styles.conciergeButton}
                  onPress={() => router.push('/(tabs)/chat')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.conciergeButtonText}>Contact Concierge</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : error ? (
            <Animated.View style={styles.errorContainer} entering={FadeInUp.delay(200)}>
              <View style={styles.errorCard}>
                {error === 'TELEHEALTH_ACTIVATION_PENDING' ? (
                  <>
                    <AlertCircle size={48} color={colors.status.warning} style={styles.errorIcon} />
                    <Text style={styles.errorTitle}>Telehealth Activation Pending</Text>
                    <Text style={styles.errorText}>
                      Your telehealth access is still being processed. This can take some time after enrollment.
                    </Text>

                    <TouchableOpacity
                      style={styles.conciergeButton}
                      onPress={() => router.push('/(tabs)/chat')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.conciergeButtonText}>Contact Concierge</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => router.back()}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <AlertCircle size={48} color={colors.status.error} style={styles.errorIcon} />
                    <Text style={styles.errorTitle}>Connection Failed</Text>
                    <Text style={styles.errorText}>{error}</Text>

                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleRetry}
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={20} color={colors.background.default} />
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    <View style={styles.errorActions}>
                      <Text style={styles.helpText}>
                        If this problem persists, please contact our Concierge team for assistance.
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={styles.infoContainer} entering={FadeInUp.delay(200)}>
              <View style={styles.infoCard}>
                <ExternalLink size={48} color={colors.primary.main} style={styles.infoIcon} />
                <Text style={styles.infoTitle}>Ready to Connect</Text>
                <Text style={styles.infoText}>
                  Tap the button above to securely access your telehealth portal.
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: spacing.sm,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  contentLoadingRoot: {
    flex: 1,
    minHeight: 0,
  },
  loadingImmersive: {
    flex: 1,
  },
  memberNotFoundContainer: {
    alignItems: 'center',
  },
  memberNotFoundCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...cardChromeLg,
    maxWidth: 350,
    width: '100%',
  },
  memberNotFoundIcon: {
    marginBottom: spacing.lg,
  },
  memberNotFoundTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  memberNotFoundText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  conciergeButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  conciergeButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.body2,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...cardChromeLg,
    maxWidth: 350,
    width: '100%',
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  retryButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },
  errorActions: {
    width: '100%',
  },
  helpText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...cardChromeLg,
    maxWidth: 350,
    width: '100%',
  },
  infoIcon: {
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  webviewContainer: {
    flex: 1,
  },
  futurePlanContainer: {
    alignItems: 'center',
  },
  futurePlanCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...cardChromeLg,
    maxWidth: 350,
    width: '100%',
  },
  futurePlanIcon: {
    marginBottom: spacing.lg,
  },
  futurePlanTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  futurePlanDate: {
    ...typography.h4,
    color: colors.primary.main,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  futurePlanText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  futurePlanSubtext: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  scheduleButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : {}),
  },
  scheduleButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },
});
