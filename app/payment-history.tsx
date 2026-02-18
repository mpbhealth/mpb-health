import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import type WebView from 'react-native-webview';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { colors } from '@/constants/theme';
import { responsiveSize, platformStyles } from '@/utils/scaling';

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { headerPaddingTop } = useSafeHeaderPadding();
  const { userData } = useUserData();
  const webViewRef = useRef<WebView>(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);

  const handleNavigationStateChange = useCallback((navState: { canGoBack?: boolean }) => {
    setWebViewCanGoBack(Boolean(navState.canGoBack));
  }, []);

  const handleBackPress = useCallback(() => {
    if (webViewCanGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return;
    }
    Alert.alert(
      'Exit Payment',
      'Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }, [webViewCanGoBack, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });
    return () => backHandler.remove();
  }, [handleBackPress]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { paddingTop: headerPaddingTop }]} entering={FadeInDown.delay(100)}>
        <View style={styles.headerTopRow}>
          <BackButton onPress={handleBackPress} />
          <SmartText variant="h2" style={styles.title}>Payment</SmartText>
        </View>
        <View style={styles.headerDetails}>
          <SmartText variant="body2" style={styles.headerDetailText} numberOfLines={1}>
            Your Member ID: {userData?.member_id ?? '—'}
          </SmartText>
          <SmartText variant="body2" style={styles.headerDetailText} numberOfLines={1}>
            Your Email: {userData?.email ?? '—'}
          </SmartText>
        </View>
      </Animated.View>
      <WebViewContainer
        ref={webViewRef}
        url="https://www.1enrollment.com/index.cfm?id=364279"
        onNavigationStateChange={handleNavigationStateChange}
        highSecurity
      />
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
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
    flex: 1,
    minWidth: 0,
  },
  headerDetails: {
    marginTop: responsiveSize.sm,
    paddingLeft: responsiveSize.xs,
    gap: responsiveSize.xs / 2,
  },
  headerDetailText: {
    color: colors.text.secondary,
  },
});
