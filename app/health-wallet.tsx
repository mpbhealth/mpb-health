import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Platform, SafeAreaView, Text, Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Wallet } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

export default function HealthWalletScreen() {
  const router = useRouter();
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

  const handleBackPress = () => {
    // For all pages except landing/login, if WebView can go back, navigate back within WebView
    if (webViewCanGoBack && webViewRef.current && !currentUrl.includes('/landing') && !currentUrl.includes('/login')) {
      webViewRef.current.goBack();
      return;
    }

    // Show exit confirmation for landing/login pages or when WebView cannot go back
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
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={handleBackPress} />
        <View style={styles.titleContainer}>
          <Wallet size={24} color={colors.primary.main} style={styles.titleIcon} />
          <View style={styles.titleTextContainer}>
            <Text style={styles.title}>HealthWallet</Text>
            <Text style={styles.memberIdInTitle}>ID: {userData?.member_id}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.webviewContainer}>
        <WebViewContainer 
          ref={webViewRef}
          url="https://web.thehealthwallet.com/landing" 
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </SafeAreaView>
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
    ...Platform.select({
      web: {
        paddingTop: spacing.md,
      },
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: spacing.xl,
      },
    }),
    ...shadows.sm,
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
  titleTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  memberIdInTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
});