import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { colors } from '@/constants/theme';
import { screenChrome, screenHeaderRow } from '@/utils/screenChrome';

interface ScreenLayoutProps {
  /** Screen title (header) */
  title: string;
  /** Optional small label above title (uppercase overline style) */
  overline?: string;
  /** Back button press (e.g. router.back) */
  onBack: () => void;
  /** Main content (rendered inside ScrollView) */
  children: React.ReactNode;
  /** If true, content is not scrollable (e.g. WebView below header) */
  noScroll?: boolean;
  /** Optional header right element */
  headerRight?: React.ReactNode;
}

/**
 * Consistent screen shell: safe-area header (back + title) + scroll content.
 * Matches stack screens: hairline header rule, paper body, lg horizontal inset.
 */
export function ScreenLayout({
  title,
  overline,
  onBack,
  children,
  noScroll = false,
  headerRight,
}: ScreenLayoutProps) {
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();

  const header = (
    <View style={screenHeaderRow(headerPaddingTop)}>
      <BackButton onPress={onBack} />
      {overline ? (
        <View style={screenChrome.headerTitleColumn}>
          <SmartText variant="overline" style={screenChrome.overline} numberOfLines={2} ellipsizeMode="tail">
            {overline}
          </SmartText>
          <SmartText variant="h2" style={styles.headerH2} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </SmartText>
        </View>
      ) : (
        <SmartText variant="h2" style={screenChrome.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </SmartText>
      )}
      {headerRight ?? <View style={styles.placeholder} />}
    </View>
  );

  if (noScroll) {
    return (
      <View style={screenChrome.container}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <View style={screenChrome.container}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[screenChrome.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerH2: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
});
