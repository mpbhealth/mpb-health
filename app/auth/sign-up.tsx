// src/screens/SignUpScreen.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';

export default function SignUpScreen() {
  const router = useRouter();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();

  // Immediately send users into the verification flow
  useEffect(() => {
    // Using replace avoids the extra page in the back stack
    router.replace('/auth/verify-membership');
  }, [router]);

  // Fallback UI while redirecting (in case of slow devices/network)
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: headerPaddingTop }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        overScrollMode="never"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollContentPaddingBottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={styles.card} entering={FadeInDown.delay(80)}>
          <Text style={styles.title} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">Create App Login</Text>
          <Text style={styles.subtitle} allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail">
            Taking you to membership verification…
          </Text>

          <View style={styles.spinnerRow}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.spinnerText} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">Loading</Text>
          </View>

          {/* Helpful links in case navigation is interrupted */}
          <TouchableOpacity
            style={styles.supportContainer}
            onPress={() => router.push('/auth/member-support')}
          >
            <Text style={styles.supportText} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">
              Need help? Contact our Concierge team
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInContainer}
            onPress={() => router.push('/auth/sign-in')}
          >
            <Text style={styles.signInText} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">
              Already created a login?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    flexShrink: 1,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  spinnerText: {
    ...typography.body2,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  supportContainer: { alignItems: 'center', marginBottom: spacing.md },
  supportText: {
    ...typography.body2,
    color: colors.primary.main,
    textDecorationLine: 'underline',
    flexShrink: 1,
  },
  signInContainer: { alignItems: 'center' },
  signInText: { ...typography.body2, color: colors.text.secondary, flexShrink: 1 },
  signInLink: { color: colors.primary.main, fontWeight: '600' },
});
