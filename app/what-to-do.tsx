import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/common/BackButton';
import { Heart, Phone, Ambulance, Calendar, AlertCircle as AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function WhatToDoScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'Large Medical Need',
      icon: Heart,
      color: '#0891b2',
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
      color: '#059669',
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
      color: '#7c3aed',
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
      color: '#f59e0b',
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
        <Text style={styles.title}>What to do?</Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={styles.introCard}
          entering={FadeInUp.delay(200)}
        >
          <AlertCircle size={24} color="#0891b2" />
          <Text style={styles.introText}>
            This guide helps you understand what to do in different medical situations. Always contact our Concierge team if you need assistance or have questions.
          </Text>
        </Animated.View>

        {sections.map((section, index) => (
          <Animated.View
            key={section.title}
            style={styles.sectionCard}
            entering={FadeInUp.delay(300 + index * 100)}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${section.color}15` }]}>
                <section.icon size={24} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.sectionContent}>
              {section.subtitle && (
                <Text style={styles.subtitle}>{section.subtitle}</Text>
              )}

              {section.items && (
                <View style={styles.itemsList}>
                  {section.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.item}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {section.subsections && section.subsections.map((subsection, subIndex) => (
                <View key={subIndex} style={styles.subsection}>
                  <Text style={styles.subtitle}>{subsection.subtitle}</Text>
                  <View style={styles.itemsList}>
                    {subsection.items.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.item}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For any questions or assistance, contact our Concierge team.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 15,
    color: '#0c4a6e',
    lineHeight: 24,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 12,
  },
  itemsList: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  subsection: {
    marginTop: 16,
  },
  footer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});