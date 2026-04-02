import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { useUserData } from '@/hooks/useUserData';
import { colors } from '@/constants/theme';
import { moderateScale } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { hubScreenHeader, hubHeaderA11y, hubScreenStates } from '@/utils/hubListScreenLayout';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { supabase } from '@/lib/supabase';
import {
  getRxCardSessionCache,
  setRxCardSessionCache,
} from '@/utils/rxCardSessionCache';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

export default function RxCardScreen() {
  const router = useRouter();
  const { headerPaddingTop } = useSafeHeaderPadding();
  const { userData, loading } = useUserData();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
        setError('Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
      } finally {
        setAuthLoading(false);
      }
    };

    getAccessToken();
  }, []);

  useEffect(() => {
    if (accessToken && userData?.member_id) {
      fetchPDF();
    }
  }, [accessToken, userData?.member_id]);

  const fetchPDF = async (opts?: { forceRefresh?: boolean }) => {
    if (!accessToken) {
      setError('Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
      return;
    }

    const membershipNumber = userData?.member_id || '1445611826';

    if (!opts?.forceRefresh && Platform.OS !== 'web') {
      const sessionCached = getRxCardSessionCache(membershipNumber);
      if (sessionCached) {
        setPdfUrl(sessionCached);
        setError(null);
        setPdfLoading(false);
        return;
      }
    }

    setPdfLoading(true);
    setError(null);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/fetch-rx-card?membershipNumber=${membershipNumber}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.' }));
        throw new Error(errorData.error || 'Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error('Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
      }

      const blob = await response.blob();

      if (Platform.OS === 'web') {
        const url_created = URL.createObjectURL(blob);
        setPdfUrl(url_created);
      } else {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = typeof btoa !== 'undefined'
          ? btoa(binary)
          : Buffer.from(binary, 'binary').toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64}`;
        setPdfUrl(dataUrl);
        setRxCardSessionCache(membershipNumber, dataUrl);
      }
    } catch (err) {
      console.error('Error fetching PDF:', err);
      setError(err instanceof Error ? err.message : 'Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
    } finally {
      setPdfLoading(false);
    }
  };

  const headerStyle = [hubScreenHeader.bar, { paddingTop: headerPaddingTop }];

  if (loading || authLoading) {
    return (
      <View style={screenChrome.container}>
        <View style={headerStyle}>
          <BackButton onPress={() => router.back()} />
          <View style={hubScreenHeader.content}>
            <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
              RX Discount Card
            </SmartText>
          </View>
        </View>
        <View style={hubScreenStates.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={hubScreenStates.loadingText}>
            Loading your RX card...
          </SmartText>
        </View>
      </View>
    );
  }

  return (
    <View style={screenChrome.container}>
      <View style={headerStyle}>
        <BackButton onPress={() => router.back()} />
        <View style={hubScreenHeader.content}>
          <SmartText variant="h2" style={hubScreenHeader.screenTitle} {...hubHeaderA11y.screenTitle}>
            RX Discount Card
          </SmartText>
        </View>
      </View>

      {pdfLoading && (
        <View style={hubScreenStates.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body1" style={hubScreenStates.loadingText}>
            Loading your RX card...
          </SmartText>
        </View>
      )}

      {error && !pdfLoading && (
        <View style={hubScreenStates.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={hubScreenStates.errorTitle}>
            Card Temporarily Unavailable
          </SmartText>
          <SmartText variant="body2" style={hubScreenStates.errorText}>{error}</SmartText>
          <TouchableOpacity style={hubScreenStates.retryButton} onPress={() => fetchPDF({ forceRefresh: true })}>
            <RefreshCw size={moderateScale(20)} color={colors.background.default} />
            <SmartText variant="body1" style={hubScreenStates.retryButtonText}>Try Again</SmartText>
          </TouchableOpacity>
        </View>
      )}

      {!pdfLoading && !error && pdfUrl && (
        <View style={styles.pdfContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="RX Card PDF"
            />
          ) : (
            <WebView
              source={{ uri: pdfUrl }}
              style={styles.webview}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                setError('Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color={colors.primary.main} />
                </View>
              )}
            />
          )}
        </View>
      )}

      {!pdfLoading && !error && !pdfUrl && (
        <View style={hubScreenStates.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.gray[400]} />
          <SmartText variant="h3" style={hubScreenStates.errorTitle}>Card Temporarily Unavailable</SmartText>
          <SmartText variant="body2" style={hubScreenStates.errorText}>
            Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.
          </SmartText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
  },
});
