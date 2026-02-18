import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Shield, MessageCircle } from 'lucide-react-native';
import { SmartText } from '@/components/common/SmartText';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';

interface PaymentDisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onContactConcierge?: () => void;
}

export function PaymentDisclaimerModal({
  visible,
  onClose,
  onContinue,
  onContactConcierge,
}: PaymentDisclaimerModalProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Shield size={moderateScale(24)} color={colors.primary.main} />
        </View>
        <SmartText variant="h3" style={styles.cardTitle}>
          Before you continue
        </SmartText>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <X size={moderateScale(22)} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
      >
        <SmartText variant="body1" style={styles.paragraph}>
          If this is your first time using the payment portal, please note: because of HIPAA policies and for security reasons, the portal uses a separate login.
        </SmartText>

        <SmartText variant="body1" style={styles.paragraph}>
          If you haven't accessed the portal before, please:
        </SmartText>

        <View style={styles.steps}>
          <SmartText variant="body1" style={styles.step}>1. Click on "Forgot Password" on the portal login page.</SmartText>
          <SmartText variant="body1" style={styles.step}>2. Enter your email and Member ID.</SmartText>
          <SmartText variant="body1" style={styles.step}>3. You will receive an email — click the link in the email.</SmartText>
          <SmartText variant="body1" style={styles.step}>4. Set a new password. We recommend using the same password as your app for convenience.</SmartText>
        </View>

        <SmartText variant="body1" style={styles.reminder}>
          Reminder: Changing your portal password will not affect your app login.
        </SmartText>

        <SmartText variant="body1" style={styles.paragraph}>
          Then come back here and log in to the portal. If you need any help, contact our Concierge.
        </SmartText>

        {onContactConcierge ? (
          <TouchableOpacity
            style={styles.conciergeLink}
            onPress={onContactConcierge}
            activeOpacity={0.8}
          >
            <MessageCircle size={moderateScale(20)} color={colors.primary.main} />
            <SmartText variant="body1" style={styles.conciergeLinkText}>
              Contact our Concierge
            </SmartText>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <TouchableOpacity
        style={styles.continueBtn}
        onPress={onContinue}
        activeOpacity={0.9}
      >
        <SmartText variant="body1" style={styles.continueBtnText}>
          Continue to Payment Portal
        </SmartText>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.centered} pointerEvents="box-none">
          <View style={styles.wrapper} pointerEvents="box-none">
            {content}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  centered: {
    margin: responsiveSize.md,
    maxWidth: 520,
    width: '100%',
    flex: 1,
    maxHeight: '92%',
  },
  wrapper: {
    flex: 1,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.default,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? platformStyles.shadowLg : {}),
  },
  card: {
    flex: 1,
    padding: responsiveSize.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.md,
    gap: responsiveSize.sm,
  },
  iconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}18`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: responsiveSize.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveSize.xl,
  },
  paragraph: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.md,
    lineHeight: 22,
  },
  steps: {
    marginBottom: responsiveSize.md,
    paddingLeft: responsiveSize.sm,
    gap: responsiveSize.xs,
  },
  step: {
    color: colors.text.secondary,
    lineHeight: 22,
  },
  reminder: {
    color: colors.primary.dark,
    fontWeight: '600',
    marginBottom: responsiveSize.md,
    lineHeight: 22,
  },
  conciergeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    paddingVertical: responsiveSize.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  conciergeLinkText: {
    fontWeight: '600',
    color: colors.primary.main,
  },
  continueBtn: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: responsiveSize.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    marginTop: responsiveSize.sm,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  continueBtnText: {
    fontWeight: '700',
    color: colors.background.default,
  },
});
