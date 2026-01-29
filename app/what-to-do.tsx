import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { Heart, Phone, Ambulance, Calendar, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

export default function WhatToDoScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();

  const sections = [
    {
      title: 'Large Medical Need',
      icon: Heart,
      color: colors.primary.main,
      items: [
        'Doctor Choice: No network restrictions; choose your own doctor',
        'Cost: Pay only up to your Initial Unshared Amount (IUA)',
        'Submit through Concierge with Super Bill',
        'IUA must be met within 6 months'
      ]
    },
    {
      title: 'Small Medical Need',
      icon: Phone,
      color: colors.status.success,
      subtitle: 'Telehealth Access to:',
      items: [
        'Primary Care Physicians',
        'Behavioral Health Specialists',
        'Pediatricians',
        'Women\'s Healthcare Doctors'
      ]
    },
    {
      title: 'Urgent & Emergency Care',
      icon: Ambulance,
      color: colors.secondary.main,
      subsections: [
        {
          subtitle: 'Urgent Care:',
          items: [
            'Start with Telehealth',
            'Present as self-pay if facility visit needed'
          ]
        },
        {
          subtitle: 'Emergency:',
          items: [
            'Go to nearest ER',
            'Present as self-pay',
            'Transitions to Large Medical Need after IUA'
          ]
        }
      ]
    },
    {
      title: 'Annual Wellness',
      icon: Calendar,
      color: colors.status.warning,
      subsections: [
        {
          subtitle: 'HSA Plans:',
          items: [
            'Use PHCS network',
            'Includes preventive services'
          ]
        },
        {
          subtitle: 'Direct Plan:',
          items: [
            '6-month waiting period'
          ]
        },
        {
          subtitle: 'Care Plus:',
          items: [
            'Wellness visits NOT included'
          ]
        }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title}>What to do?</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <Card padding="md" variant="outlined" style={styles.introCard}>
              <AlertCircle size={moderateScale(22)} color={colors.primary.main} style={{ marginRight: responsiveSize.sm }} />
              <SmartText variant="body1" style={styles.introText}>
                This guide helps you understand what to do in different medical situations. Always contact our Concierge team if you need assistance or have questions.
              </SmartText>
            </Card>
          </Animated.View>

          {sections.map((section, index) => (
            <Animated.View
              key={section.title}
              entering={FadeInUp.delay(300 + index * 100)}
            >
              <Card padding="none" style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${section.color}15` }]}>
                    <section.icon size={moderateScale(22)} color={section.color} />
                  </View>
                  <SmartText variant="h3" style={styles.sectionTitle}>{section.title}</SmartText>
                </View>

                <View style={styles.sectionContent}>
                  {section.subtitle && (
                    <SmartText variant="body1" style={styles.subtitle}>{section.subtitle}</SmartText>
                  )}

                  {section.items && (
                    <View style={styles.itemsList}>
                      {section.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.item}>
                          <SmartText variant="body1" style={styles.bullet}>•</SmartText>
                          <SmartText variant="body1" style={styles.itemText}>{item}</SmartText>
                        </View>
                      ))}
                    </View>
                  )}

                  {section.subsections && section.subsections.map((subsection, subIndex) => (
                    <View key={subIndex} style={styles.subsection}>
                      <SmartText variant="body1" style={styles.subtitle}>{subsection.subtitle}</SmartText>
                      <View style={styles.itemsList}>
                        {subsection.items.map((item, itemIndex) => (
                          <View key={itemIndex} style={styles.item}>
                            <SmartText variant="body1" style={styles.bullet}>•</SmartText>
                            <SmartText variant="body1" style={styles.itemText}>{item}</SmartText>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          ))}

          <View style={styles.footer}>
            <SmartText variant="body2" style={styles.footerText}>
              For any questions or assistance, contact our Concierge team.
            </SmartText>
          </View>
        </View>
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
    padding: responsiveSize.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...platformStyles.shadowSm,
  },
  title: {
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: responsiveSize.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSize.md,
    paddingBottom: responsiveSize.xl,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  introCard: {
    backgroundColor: colors.primary.main + '08',
    borderColor: colors.primary.main + '20',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.lg,
  },
  introText: {
    flex: 1,
    color: colors.primary.dark,
  },

  sectionCard: {
    marginBottom: responsiveSize.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSize.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: responsiveSize.sm,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionContent: {
    padding: responsiveSize.md,
    gap: responsiveSize.sm,
  },
  subtitle: {
    fontWeight: '500',
    color: colors.text.secondary,
  },
  itemsList: {
    gap: responsiveSize.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.xs,
  },
  bullet: {
    color: colors.text.secondary,
    marginTop: moderateScale(1),
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    color: colors.text.secondary,
  },
  subsection: {
    gap: responsiveSize.xs,
  },
  footer: {
    marginTop: responsiveSize.xs,
    marginBottom: responsiveSize.lg,
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
