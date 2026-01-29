import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, platformStyles, moderateScale } from '@/utils/scaling';
import { supabase } from '@/lib/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

export default function RxCardScreen() {
  const router = useRouter();
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

  const fetchPDF = async () => {
    if (!accessToken) {
      setError('Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
      return;
    }

    setPdfLoading(true);
    setError(null);

    try {
      const membershipNumber = userData?.member_id || '1445611826';
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
      }
    } catch (err) {
      console.error('Error fetching PDF:', err);
      setError(err instanceof Error ? err.message : 'Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <SmartText variant="h3" style={styles.headerTitle}>RX Discount Card</SmartText>
        </View>
      </View>

      {pdfLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <SmartText variant="body2" style={styles.loadingText}>Loading your RX card...</SmartText>
        </View>
      )}

      {error && !pdfLoading && (
        <View style={styles.errorStateContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={moderateScale(48)} color={colors.status.error} />
            </View>
            <SmartText variant="h4" style={styles.errorTitle}>Card Temporarily Unavailable</SmartText>
            <SmartText variant="body2" style={styles.errorMessage}>{error}</SmartText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchPDF}>
              <RefreshCw size={moderateScale(18)} color={colors.background.default} />
              <SmartText variant="body2" style={styles.retryButtonText}>Try Again</SmartText>
            </TouchableOpacity>
          </View>
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
        <View style={styles.errorStateContainer}>
          <View style={styles.errorCard}>
            <View style={[styles.errorIconContainer, { backgroundColor: `${colors.gray[400]}15` }]}>
              <AlertCircle size={moderateScale(48)} color={colors.gray[400]} />
            </View>
            <SmartText variant="h4" style={styles.errorTitle}>Card Temporarily Unavailable</SmartText>
            <SmartText variant="body2" style={styles.errorMessage}>
              Your RX card is currently unavailable. Please try again in a few moments or contact our concierge team for assistance.
            </SmartText>
          </View>
        </View>
      )}
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
    padding: responsiveSize.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...platformStyles.shadowSm,
  },
  headerContent: {
    flex: 1,
    marginLeft: responsiveSize.sm,
  },
  headerTitle: {
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: responsiveSize.md,
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: responsiveSize.sm,
  },
  errorStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
    backgroundColor: colors.background.paper,
  },
  errorCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.xl,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...platformStyles.shadowMd,
  },
  errorIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: `${colors.status.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
  },
  errorTitle: {
    color: colors.text.primary,
    marginBottom: responsiveSize.sm,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: responsiveSize.xl,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.xl,
    paddingVertical: responsiveSize.md,
    borderRadius: borderRadius.md,
    gap: responsiveSize.sm,
    minWidth: 140,
  },
  retryButtonText: {
    color: colors.background.default,
    fontWeight: '600',
  },
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
