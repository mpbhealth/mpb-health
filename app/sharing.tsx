import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { ExternalLink, AlertTriangle, Building2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  Layout,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function SharingScreen() {
  const router = useRouter();
  const { userData, loading } = useUserData();
  const [selectedProgram, setSelectedProgram] = useState<{
    title: string;
    url: string;
    color: string;
  } | null>(null);

  // Product IDs that should see Zion Health
  const zionHealthProductIds = [
    '29795', '29870', '30445', '30658', '30659', '31103', 
    '32399', '35693', '35768', '35770', '40416', '42464', 
    '42465', '42467', '42469', '42551', '42552', '42553', 
    '45800', '46405', '45742', 'EMPLOYEE'
  ];

  // Product IDs that should see Sedera Health
  const sederaHealthProductIds = ['43957', '44036','46455', ,'38035'];

  // Determine which programs to show based on product_id
  const availablePrograms = [];
  
  if (userData?.product_id) {
    if (zionHealthProductIds.includes(userData.product_id)) {
      availablePrograms.push({
        title: 'Zion Health',
        description: 'Access your Zion Health sharing program to submit and manage your medical needs',
        url: 'https://members.zionhealthshare.org/dashboard',
        color: colors.primary.main,
        gradient: `${colors.primary.main}15`,
      });
    }
    
    if (sederaHealthProductIds.includes(userData.product_id)) {
      availablePrograms.push({
        title: 'Sedera Health',
        description: 'Access your Sedera Health sharing program to submit and track your medical needs',
        url: 'https://sedera.my.site.com/MemberPortal/s/login/',
        color: colors.secondary.main,
        gradient: `${colors.secondary.main}15`,
      });
    }
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  if (selectedProgram) {
    return (
      <Animated.View 
        style={styles.container}
        entering={SlideInRight}
        exiting={SlideOutLeft}
      >
        <View style={styles.header}>
          <BackButton onPress={() => setSelectedProgram(null)} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{selectedProgram.title}</Text>
          </View>
        </View>

        <WebViewContainer url={selectedProgram.url} />
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={styles.header}
        entering={FadeInDown.delay(100)}
      >
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Sharing</Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text 
          style={styles.description}
          entering={FadeInUp.delay(200)}
        >
          Our sharing connect you with a community of health-conscious individuals who share in each other's medical expenses. Submit and manage your medical needs through your designated sharing program.
        </Animated.Text>

        {availablePrograms.map((program, index) => (
          <AnimatedTouchableOpacity
            key={program.title}
            style={styles.programCard}
            onPress={() => setSelectedProgram(program)}
            entering={FadeInUp.delay(300 + index * 100)}
            layout={Layout.springify()}
          >
            <View style={styles.programContent}>
              <View style={[styles.iconContainer, { backgroundColor: program.gradient }]}>
                <Building2 size={24} color={program.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programDescription}>{program.description}</Text>
              </View>
            </View>
            <ExternalLink size={20} color={program.color} />
          </AnimatedTouchableOpacity>
        ))}

        <Animated.View 
          style={styles.warningCard}
          entering={FadeInUp.delay(400)}
        >
          <AlertTriangle size={24} color={colors.status.warning} />
          <Text style={styles.warningText}>
            Once you have met your initial unshareable amount, you may open a need through the sharing program included in your membership. If you are unsure which sharing program you are enrolled in, please contact our concierge for assistance.
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
    ...shadows.sm
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
  description: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  warningCard: {
    backgroundColor: `${colors.status.warning}08`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    ...typography.body2,
    color: colors.status.warning,
    lineHeight: 20,
  },
  programCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  programContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  programTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  programDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    lineHeight: 20,
  }
});