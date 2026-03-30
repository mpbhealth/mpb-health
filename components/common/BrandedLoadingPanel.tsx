import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import {
  moderateScale,
  cardChromeSm,
  responsiveSize,
  platformStyles,
  androidCardOutline,
} from '@/utils/scaling';

const logoImg = require('../../assets/images/logo.png');

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type BrandedLoadingPanelProps = {
  title?: string;
  subtitle: string;
  hint?: string | null;
  compact?: boolean;
  variant?: 'card' | 'immersive';
  elevated?: boolean;
};

export function BrandedLoadingPanel({
  title = 'Loading…',
  subtitle,
  hint,
  compact = false,
  variant = 'card',
  elevated = false,
}: BrandedLoadingPanelProps) {
  const ringPulse = useSharedValue(1);

  useEffect(() => {
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [ringPulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringPulse.value }],
  }));

  const a11yLabel = [title, subtitle, hint].filter(Boolean).join('. ');

  const panel = (
    <Animated.View
      entering={FadeInDown.duration(340)}
      style={[
        styles.panel,
        compact && styles.panelCompact,
        (variant === 'immersive' || elevated) && styles.panelElevated,
      ]}
    >
      <Image
        source={logoImg}
        style={[styles.logo, compact && styles.logoCompact]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Animated.View style={[styles.spinnerRing, compact && styles.spinnerRingCompact, ringStyle]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </Animated.View>
      <SmartText variant="h3" style={styles.title}>
        {title}
      </SmartText>
      <SmartText variant="body1" style={styles.subtitle}>
        {subtitle}
      </SmartText>
      {hint ? (
        <SmartText variant="body2" style={styles.hint}>
          {hint}
        </SmartText>
      ) : null}
    </Animated.View>
  );

  if (variant === 'immersive') {
    return (
      <View
        style={styles.immersiveRoot}
        accessibilityRole="progressbar"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ busy: true }}
      >
        <View style={styles.immersiveWash} pointerEvents="none" />
        <View style={styles.immersiveAccent} pointerEvents="none" />
        <View style={styles.immersiveContent}>{panel}</View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ busy: true }}
    >
      {panel}
    </View>
  );
}

const styles = StyleSheet.create({
  immersiveRoot: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background.subtle,
  },
  immersiveWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.035),
  },
  immersiveAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
    backgroundColor: rgbaFromHex(colors.primary.main, 0.065),
    borderBottomLeftRadius: borderRadius.xl * 2,
    borderBottomRightRadius: borderRadius.xl * 2,
  },
  immersiveContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSize.xl,
  },
  panel: {
    width: '100%',
    maxWidth: moderateScale(316),
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    paddingTop: responsiveSize.xl + responsiveSize.sm,
    paddingBottom: responsiveSize.xl,
    paddingHorizontal: responsiveSize.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[100],
    ...cardChromeSm,
  },
  panelCompact: {
    maxWidth: moderateScale(300),
    paddingTop: responsiveSize.xl,
    paddingBottom: responsiveSize.lg,
    paddingHorizontal: responsiveSize.md,
  },
  panelElevated: {
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : androidCardOutline),
  },
  logo: {
    width: moderateScale(128),
    height: moderateScale(36),
    maxWidth: '90%',
    marginBottom: responsiveSize.lg,
    opacity: 0.9,
  },
  logoCompact: {
    width: moderateScale(108),
    height: moderateScale(30),
    marginBottom: responsiveSize.md,
  },
  spinnerRing: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    backgroundColor: rgbaFromHex(colors.primary.main, 0.07),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: rgbaFromHex(colors.primary.main, 0.14),
  },
  spinnerRingCompact: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    marginBottom: responsiveSize.md,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: responsiveSize.sm,
    alignSelf: 'stretch',
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    alignSelf: 'stretch',
  },
  hint: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: responsiveSize.md,
    fontStyle: 'italic',
    alignSelf: 'stretch',
  },
});
