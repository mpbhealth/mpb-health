import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Heart, ExternalLink, Copy, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HospitalDebtReliefScreen() {
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);
  const [showApplicationWebView, setShowApplicationWebView] = useState(false);

  const employerCode = 'ss10610';

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(employerCode);
      setCodeCopied(true);
      Alert.alert('Copied!', 'Employer code copied to clipboard');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Failed to copy code to clipboard');
    }
  };

  if (showApplicationWebView) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => setShowApplicationWebView(false)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Debt Dismissal Application</Text>
          </View>
        </View>
        <WebViewContainer url="https://debtdismissal.myfa.app/" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Hospital Debt Relief</Text>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={styles.introCard} entering={FadeInUp.delay(200)}>
          <Heart size={24} color={colors.primary.main} />
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Debt Dismissal Program</Text>
            <Text style={styles.introText}>
              Access financial relief for eligible hospital debt through our member benefit program.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={styles.disclaimerCard} entering={FadeInUp.delay(300)}>
          <View style={styles.disclaimerHeader}>
            <AlertTriangle size={20} color={colors.status.warning} />
            <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
          </View>
          <Text style={styles.disclaimerText}>
            The Debt Dismissal Program is a member benefit subject to eligibility requirements, program guidelines, and provider acceptance. Approval and the amount of debt dismissal are limited by the program's federal poverty guidelines, and members remain responsible for any charges not approved under the program.
          </Text>
        </Animated.View>

        <Animated.View style={styles.codeCard} entering={FadeInUp.delay(400)}>
          <Text style={styles.codeTitle}>Debt Dismissal Employer Code</Text>
          <Text style={styles.codeInstruction}>
            Enter this code when applying for debt dismissal:
          </Text>

          <View style={styles.codeContainer}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{employerCode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, codeCopied && styles.copyButtonSuccess]}
              onPress={handleCopyCode}
            >
              <Copy size={20} color={codeCopied ? colors.status.success : colors.primary.main} />
              <Text style={[styles.copyButtonText, codeCopied && styles.copyButtonTextSuccess]}>
                {codeCopied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={styles.actionCard} entering={FadeInUp.delay(500)}>
          <AnimatedTouchableOpacity
            style={styles.applicationSection}
            onPress={() => setShowApplicationWebView(true)}
            entering={FadeInUp.delay(500)}
          >
            <View style={styles.applicationSectionContent}>
              <View style={styles.applicationIconContainer}>
                <ExternalLink size={24} color={colors.primary.main} />
              </View>
              <View style={styles.applicationTextContainer}>
                <Text style={styles.applicationSectionTitle}>Start Your Application</Text>
                <Text style={styles.applicationSectionDescription}>
                  Access the debt dismissal application portal
                </Text>
              </View>
            </View>
          </AnimatedTouchableOpacity>

          <Text style={styles.applicationNote}>
            Complete your application using the employer code above
          </Text>
        </Animated.View>
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
    backgroundColor: colors.background.default,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  introCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    ...shadows.md,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  introText: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  disclaimerCard: {
    backgroundColor: `${colors.status.warning}08`,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  disclaimerTitle: {
    ...typography.h4,
    color: colors.status.warning,
  },
  disclaimerText: {
    ...typography.body1,
    color: colors.status.warning,
    lineHeight: 24,
  },
  codeCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  codeTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  codeInstruction: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  codeBox: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  codeText: {
    ...typography.h2,
    color: colors.primary.main,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },

  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary.main}10`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  copyButtonSuccess: {
    backgroundColor: `${colors.status.success}10`,
  },
  copyButtonText: {
    ...typography.body2,
    color: colors.primary.main,
    fontWeight: '600',
  },
  copyButtonTextSuccess: {
    color: colors.status.success,
  },
  actionCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  applicationSection: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  applicationSectionContent: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  applicationTextContainer: {
    flex: 1,
  },
  applicationSectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  applicationSectionDescription: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  applicationNote: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
