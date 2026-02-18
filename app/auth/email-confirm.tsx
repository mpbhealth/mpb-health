import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing } from '@/constants/theme';
import * as Linking from 'expo-linking';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';

export default function EmailConfirmScreen() {
  const router = useRouter();
  const { headerPaddingTop } = useSafeHeaderPadding();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error during email confirmation:', sessionError);
          setTimeout(() => {
            router.replace('/auth/sign-in');
          }, 2000);
          return;
        }

        if (session?.user) {
          // Get the user's current auth email (this will be the new email after confirmation)
          const newEmail = session.user.email;

          if (newEmail) {
            // Update the email in the users table to match the confirmed auth email
            const { error: updateError } = await supabase
              .from('users')
              .update({ email: newEmail })
              .eq('id', session.user.id);

            if (updateError) {
              console.error('Failed to update email in users table:', updateError);
              Alert.alert(
                'Email Confirmation Error',
                'Your email was confirmed but there was an issue updating your profile. Please contact support.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
              );
              return;
            }

            console.log('Email successfully confirmed and updated in both auth and users table');

            // ...
            // Success - redirect back to change-email page with success parameter
            setTimeout(() => {
              router.replace({
                pathname: '/profile-settings/change-email',
                query: { 'email-change-success': 'true' },
              } as any);
            }, 1500);

          } else {
            // No email in session, something went wrong
            setTimeout(() => {
              router.replace('/auth/sign-in');
            }, 2000);
          }
        } else {
          // No session, redirect to sign-in
          setTimeout(() => {
            router.replace('/auth/sign-in');
          }, 2000);
        }
      } catch (error) {
        console.error('Error during email confirmation:', error);
        setTimeout(() => {
          router.replace('/auth/sign-in');
        }, 2000);
      }
    };

    checkAuthAndRedirect();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: headerPaddingTop }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.messageTitle}>Confirming your email...</Text>
        <Text style={styles.messageText}>
          Please wait while we confirm your email address.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: spacing.md,
    backgroundColor: colors.background.paper,
  },
  messageTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  messageText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});