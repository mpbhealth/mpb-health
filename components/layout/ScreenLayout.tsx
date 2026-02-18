import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { colors } from '@/constants/theme';
import { responsiveSize, platformStyles } from '@/utils/scaling';

interface ScreenLayoutProps {
  /** Screen title (header) */
  title: string;
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
 * Use on any screen for layout consistency and correct insets on all devices.
 */
export function ScreenLayout({
  title,
  onBack,
  children,
  noScroll = false,
  headerRight,
}: ScreenLayoutProps) {
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();

  const header = (
    <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
      <BackButton onPress={onBack} />
      <SmartText variant="h2" style={styles.title} numberOfLines={1}>
        {title}
      </SmartText>
      {headerRight ?? <View style={styles.placeholder} />}
    </View>
  );

  if (noScroll) {
    return (
      <View style={styles.container}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollContentPaddingBottom },
        ]}
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
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
    backgroundColor: colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  title: {
    flex: 1,
    marginLeft: responsiveSize.xs,
    color: colors.text.primary,
    fontWeight: '700',
    minWidth: 0,
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSize.md,
    flexGrow: 1,
  },
});
