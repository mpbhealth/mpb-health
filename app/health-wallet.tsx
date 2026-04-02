/**
 * Route shell only: the real WebView lives in `HealthWalletPortal` so it stays mounted when
 * this screen pops, preserving HealthWallet session state (see portal docstring).
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/theme';
import { useHealthWalletVisibility } from '@/contexts/HealthWalletVisibilityContext';

export default function HealthWalletScreen() {
  const { setRouteFocused } = useHealthWalletVisibility();

  useFocusEffect(
    useCallback(() => {
      setRouteFocused(true);
      return () => setRouteFocused(false);
    }, [setRouteFocused]),
  );

  return <View style={{ flex: 1, backgroundColor: colors.background.default }} collapsable={false} />;
}
