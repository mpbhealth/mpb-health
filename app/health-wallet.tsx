import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Wallet } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { platformStyles } from '@/utils/scaling';

export default function HealthWalletScreen() {
  const router = useRouter();
  const { headerPaddingTop } = useSafeHeaderPadding();
  const { userData, loading } = useUserData();
  const webViewRef = useRef<WebView>(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, [webViewCanGoBack, currentUrl]);

  if (loading) {
    return <LoadingIndicator />;
  }

  const isOnLandingOrSignIn = () => {
    const url = (currentUrl || '').toLowerCase();
    return (
      url.includes('/landing') ||
      url.includes('/login') ||
      url.includes('/signin') ||
      url.includes('/sign-in')
    );
  };

  const handleBackPress = () => {
    // On landing or sign-in page: back means exit HealthWallet → show exit confirmation
    if (isOnLandingOrSignIn()) {
      Alert.alert(
        'Exit HealthWallet',
        'Are you sure you want to exit HealthWallet?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() }
        ]
      );
      return;
    }

    // On any other page: if WebView can go back, navigate back within WebView
    if (webViewCanGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return;
    }

    // Cannot go back within WebView → show exit confirmation
    Alert.alert(
      'Exit HealthWallet',
      'Are you sure you want to exit HealthWallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    setWebViewCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[styles.header, { paddingTop: headerPaddingTop }]}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={handleBackPress} />
        <View style={styles.titleContainer}>
          <Wallet size={24} color={colors.primary.main} style={styles.titleIcon} />
          <Text style={styles.title}>HealthWallet</Text>
        </View>
      </Animated.View>

      <View style={styles.webviewContainer}>
        <WebViewContainer
          ref={webViewRef}
          url="https://web.thehealthwallet.com/landing"
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          highSecurity
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    flex: 1,
  },
  titleIcon: {
    marginRight: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
});