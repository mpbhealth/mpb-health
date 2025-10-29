import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stethoscope, ExternalLink, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

export default function TelehealthSSOScreen() {
  const router = useRouter();
  const { redirectId } = useLocalSearchParams<{ redirectId?: string }>();
  const { userData, loading: userLoading } = useUserData();
  const { session } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMemberNotFound, setShowMemberNotFound] = useState(false);
  const [ssoUrl, setSsoUrl] = useState<string | null>(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);
  const webViewRef = React.useRef<WebView>(null);

  useEffect(() => {
    if (!userLoading && userData && session) {
      initiateSSO();
    }
  }, [userLoading, userData, session]);

  const initiateSSO = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShowMemberNotFound(false);

      if (!session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      if (!userData?.member_id) {
        throw new Error('Member ID not found. Please contact support.');
      }

      console.log('Initiating MyTelemedicine SSO for member:', userData.member_id);

      // Call the Supabase Edge Function
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/mytelemedicine-sso`;
      
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const body = JSON.stringify({
        member_id: userData.member_id,
        redirect_id: redirectId
      });

      console.log('Making SSO request to Edge Function...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body,
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Check for member not found error
        if (response.status === 400 && responseData.error?.includes('Member not found')) {
          setShowMemberNotFound(true);
          return;
        }
        throw new Error(responseData.error || 'Failed to generate SSO access');
      }

      if (!responseData.success || !responseData.ssoUrl) {
        throw new Error('Invalid response from SSO service');
      }

      console.log('SSO URL generated successfully, opening browser...');

      // Set the SSO URL to show in WebView
      setSsoUrl(responseData.ssoUrl);

    } catch (err) {
      console.error('MyTelemedicine SSO error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      // Check for specific telehealth access generation error
      if (errorMessage.includes('Failed to generate telehealth access')) {
        setError('TELEHEALTH_ACTIVATION_PENDING');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Android back button for WebView navigation
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ssoUrl) {
        handleBackPress();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [ssoUrl, webViewCanGoBack]);

  const handleBackPress = () => {
    if (webViewCanGoBack && webViewRef.current) {
      // If WebView can go back, navigate back within WebView
      webViewRef.current.goBack();
    } else {
      // If WebView cannot go back, show exit confirmation
      Alert.alert(
        'Exit Telehealth',
        'Are you sure you want to exit the telehealth portal?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Exit', 
            style: 'destructive', 
            onPress: () => {
              setSsoUrl(null);
              router.back();
            }
          }
        ]
      );
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    setWebViewCanGoBack(navState.canGoBack);
  };

  if (userLoading) {
    return <LoadingIndicator message="Loading user data..." />;
  }

  // Show WebView if SSO URL is available
  if (ssoUrl) {
    return (
      <View style={styles.container}>
        <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
          <BackButton onPress={handleBackPress} />
          <View style={styles.headerContent}>
            <Stethoscope size={24} color={colors.primary.main} />
            <Text style={styles.headerTitle}>Telehealth Portal</Text>
          </View>
        </Animated.View>

        <View style={styles.webviewContainer}>
          <WebViewContainer 
            ref={webViewRef}
            url={ssoUrl}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <Stethoscope size={24} color={colors.primary.main} />
          <Text style={styles.headerTitle}>Telehealth Portal</Text>
        </View>
      </Animated.View>

      <View style={styles.content}>
        {isLoading ? (
          <Animated.View style={styles.loadingContainer} entering={FadeInUp.delay(200)}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary.main} style={styles.spinner} />
              <Text style={styles.loadingTitle}>Connecting to Telehealth</Text>
              <Text style={styles.loadingText}>
                We're securely connecting you to your telehealth portal...
              </Text>
            </View>
          </Animated.View>
        ) : showMemberNotFound ? (
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
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: spacing.sm,
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
  loadingContainer: {
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
    maxWidth: 350,
    width: '100%',
  },
  spinner: {
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  memberNotFoundContainer: {
    alignItems: 'center',
  },
  memberNotFoundCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
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
    ...shadows.md,
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
    ...shadows.lg,
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
    ...shadows.lg,
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
});