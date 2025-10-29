import { View, Text, StyleSheet, Platform, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Heart, Brain, MessageSquare, Pill, FileText, Phone, ChevronDown, ChevronUp, CheckCircle2, ExternalLink } from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useState } from 'react';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { WebViewContainer } from '@/components/common/WebViewContainer';


export default function PlanDetailsScreen() {
  const router = useRouter();
  const { userData, loading } = useUserData();

  if (loading) {
    return <LoadingIndicator />;
  }

  // Check if this is Staff Essentials plan
  if (userData?.is_staff_essentials) {
    router.replace('/plans/staff-essentials' as any);
    return null;
  }

  // Get the appropriate URL based on normalized product_id
  const getPlanDetailsUrl = (productId: string) => {
    const urlMap: { [key: string]: string } = {
      '42463': 'https://mpb.health/3d-flip-book/essentials/',
      '45800': 'https://mpb.health/3d-flip-book/secure-hsa/',
      '45388': 'https://mpb.health/3d-flip-book/mecessentials-handbook/',
      '42464': 'https://mpb.health/3d-flip-book/careplus/',
      '42465': 'https://mpb.health/3d-flip-book/direct-handbook/',
      '43957': 'https://mpb.health/3d-flip-book/premium-care/',
      '44036': 'https://mpb.health/3d-flip-book/premium-hsa/',
      '46456': 'https://mpb.health/3d-flip-book/premium-care/',
      '46455': 'https://mpb.health/3d-flip-book/premium-hsa/',
      '46405': 'https://mpb.health/3d-flip-book/careplus/',
    };

    return urlMap[productId] || 'https://mpb.health/3d-flip-book/careplus/';
  };

  const normalizedProductId = userData?.normalized_product_id ?? userData?.product_id;
  const planDetailsUrl = getPlanDetailsUrl(normalizedProductId || '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Plan Details</Text>
        </View>
      </View>

      <WebViewContainer url={planDetailsUrl} />
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
});