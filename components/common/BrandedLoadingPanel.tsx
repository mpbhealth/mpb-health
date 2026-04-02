import React from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  title = 'One moment',
  subtitle,
  hint,
  compact = false,
  variant = 'card',
  elevated = false,
}: BrandedLoadingPanelProps) {
  const a11yLabel = [title, subtitle, hint].filter(Boolean).join('. ');

  const panel = (
    <Animated.View
      entering={FadeInDown.duration(420).delay(40)}
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
      <View style={[styles.spinnerRing, compact && styles.spinnerRingCompact]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
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
    backgroundColor: rgbaFromHex(colors.primary.main, 0.02),
  },
  immersiveAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: rgbaFromHex(colors.primary.main, 0.042),
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
  spinnerRingCompact: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    marginBottom: responsiveSize.sm,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: responsiveSize.sm,
    alignSelf: 'stretch',
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
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
