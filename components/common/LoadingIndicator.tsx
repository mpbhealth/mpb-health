import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import {
  responsiveSize,
  moderateScale,
  platformStyles,
  cardChromeSm,
  androidCardOutline,
} from '@/utils/scaling';

const logoImg = require('../../assets/images/logo.png');

export type LoadingIndicatorVariant = 'fullscreen' | 'overlay' | 'inline';

interface LoadingIndicatorProps {
  message?: string;
  /** fullscreen: branded backdrop + centered card. overlay: scrim + card. inline: compact row (e.g. in players). */
  variant?: LoadingIndicatorVariant;
  /** Use for inline on dark backdrops (light spinner + label). */
  appearance?: 'default' | 'onDark';
}

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LoadingIndicator({
  message = 'Just a moment…',
  variant = 'fullscreen',
  appearance = 'default',
}: LoadingIndicatorProps) {
  const inlineOnDark = appearance === 'onDark';
  const inlineSpinnerColor = inlineOnDark ? '#FFFFFF' : colors.primary.main;
  const inlineLabelColor = inlineOnDark ? 'rgba(255, 255, 255, 0.92)' : colors.text.secondary;

  const a11y = {
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel: message,
    accessibilityState: { busy: true as const },
  };

  if (variant === 'inline') {
    return (
      <Animated.View entering={FadeIn.duration(240)} style={styles.inlineRoot} {...a11y}>
        <ActivityIndicator size="small" color={inlineSpinnerColor} />
        <SmartText variant="body2" style={[styles.inlineMessage, { color: inlineLabelColor }]}>
          {message}
        </SmartText>
      </Animated.View>
    );
  }

  const panel = (
    <Animated.View
      entering={FadeInDown.duration(420).delay(40)}
      style={[styles.panel, variant === 'overlay' && styles.panelElevated]}
    >
      <Image
        source={logoImg}
        style={styles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.spinnerRing}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
      <SmartText variant="body1" style={styles.message}>
        {message}
      </SmartText>
    </Animated.View>
  );

  if (variant === 'overlay') {
    return (
      <Animated.View entering={FadeIn.duration(320)} style={styles.overlayRoot} {...a11y}>
        <View style={styles.overlayScrim} />
        {panel}
      </Animated.View>
    );
  }

  return (
    <View style={styles.fullscreenRoot} {...a11y}>
      <View style={styles.ambientWash} pointerEvents="none" />
      <View style={styles.ambientAccent} pointerEvents="none" />
      <Animated.View entering={FadeIn.duration(380)} style={styles.fullscreenContent}>
        {panel}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenRoot: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background.subtle,
  },
  ambientWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: rgbaFromHex(colors.primary.main, 0.02),
  },
  ambientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: rgbaFromHex(colors.primary.main, 0.042),
    borderBottomLeftRadius: borderRadius.xl * 2,
    borderBottomRightRadius: borderRadius.xl * 2,
  },
  fullscreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSize.xl,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: responsiveSize.xl,
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
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
  panelElevated: {
    zIndex: 1,
    ...(Platform.OS === 'ios' ? platformStyles.shadowMd : androidCardOutline),
  },
  logo: {
    width: moderateScale(128),
    height: moderateScale(36),
    maxWidth: '90%',
    marginBottom: responsiveSize.lg,
    opacity: 0.9,
  },
  spinnerRing: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: rgbaFromHex(colors.primary.main, 0.05),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSize.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: rgbaFromHex(colors.primary.main, 0.1),
  },
  message: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 260,
  },
  inlineRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.sm,
    paddingVertical: responsiveSize.sm,
    paddingHorizontal: responsiveSize.md,
  },
  inlineMessage: {
    flexShrink: 1,
    lineHeight: 20,
  },
});
