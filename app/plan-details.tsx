import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, User, BookOpen, Shield, X, MessageSquare, Settings } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { useUserData } from '@/hooks/useUserData';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles, MIN_TOUCH_TARGET } from '@/utils/scaling';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Dependent {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  product_label: string;
  product_benefit: string;
  relationship: string;
}

export default function PlanDetailsScreen() {
  const router = useRouter();
  const { userData, loading: userLoading } = useUserData();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHandbook, setShowHandbook] = useState(false);

  useEffect(() => {
    async function fetchDependents() {
      if (!userData?.member_id) {
        setLoading(false);
        return;
      }

      try {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('member_id, first_name, last_name, product_label, product_benefit, relationship')
          .eq('primary_id', userData.member_id)
          .eq('is_primary', false);

        if (membersError) throw membersError;

        const dependentsWithId = (membersData || []).map((dep: Omit<Dependent, 'id'>): Dependent => ({
          ...dep,
          id: dep.member_id,
        }));

        const sortedDependents = dependentsWithId.sort((a: Dependent, b: Dependent) => {
          if (a.relationship?.toLowerCase() === 'spouse') return -1;
          if (b.relationship?.toLowerCase() === 'spouse') return 1;
          return 0;
        });

        setDependents(sortedDependents);
      } catch (err) {
        console.error('Error fetching dependents:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchDependents();
    }
  }, [userData, userLoading]);

  if (userLoading || loading) {
    return <LoadingIndicator />;
  }

  if (userData?.is_staff_essentials) {
    router.replace('/plans/staff-essentials' as any);
    return null;
  }

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

  if (showHandbook) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowHandbook(false)}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={moderateScale(24)} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Membership Handbook</SmartText>
          </View>
        </View>
        <WebViewContainer url={planDetailsUrl} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <SmartText variant="h3" style={styles.headerTitle}>Plan Details</SmartText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card padding="lg" variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <User size={moderateScale(24)} color={colors.primary.main} />
              </View>
              <SmartText variant="h4" style={styles.cardTitle}>Primary Member</SmartText>
            </View>

            <View style={styles.memberInfo}>
              <SmartText variant="body1" style={styles.memberName}>
                {userData?.first_name} {userData?.last_name}
              </SmartText>

              <View style={styles.infoRow}>
                <SmartText variant="caption" style={styles.label}>Plan Type</SmartText>
                <SmartText variant="body1" style={styles.value}>
                  {userData?.product_label || 'N/A'}
                </SmartText>
              </View>

              {userData?.product_benefit && (
                <View style={styles.infoRow}>
                  <SmartText variant="caption" style={styles.label}>Benefit Level</SmartText>
                  <SmartText variant="body1" style={styles.value}>
                    {userData.product_benefit}
                  </SmartText>
                </View>
              )}

              {userData?.is_primary && (
                <View style={styles.coverageBadge}>
                  <Users size={moderateScale(16)} color={colors.primary.main} />
                  <SmartText variant="body2" style={styles.coverageText}>
                    {dependents.length > 0
                      ? `${dependents.length + 1} ${dependents.length + 1 === 1 ? 'person' : 'people'} covered`
                      : '1 person covered'
                    }
                  </SmartText>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        <AnimatedTouchable
          entering={FadeInUp.delay(200)}
          style={styles.readMoreButton}
          onPress={() => setShowHandbook(true)}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContent}>
            <BookOpen size={moderateScale(20)} color="#fff" />
            <SmartText variant="h4" style={styles.buttonText}>
              Read Membership Handbook
            </SmartText>
          </View>
        </AnimatedTouchable>

        {dependents.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <Card padding="lg" variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Users size={moderateScale(24)} color={colors.primary.main} />
                </View>
                <SmartText variant="h4" style={styles.cardTitle}>
                  Dependents Included
                </SmartText>
              </View>

              <View style={styles.dependentsList}>
                {dependents.map((dependent, index) => (
                  <View
                    key={dependent.id}
                    style={[
                      styles.dependentRow,
                      index < dependents.length - 1 && styles.dependentRowBorder
                    ]}
                  >
                    <View style={styles.dependentAvatar}>
                      <User size={moderateScale(18)} color={colors.primary.main} />
                    </View>
                    <View style={styles.dependentInfo}>
                      <SmartText variant="body1" style={styles.dependentName}>
                        {dependent.first_name} {dependent.last_name}
                      </SmartText>
                      {dependent.relationship && (
                        <SmartText variant="caption" style={styles.relationshipText}>
                          {dependent.relationship}
                        </SmartText>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(dependents.length > 0 ? 400 : 300)}>
          <Card padding="lg" variant="elevated" style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={[styles.iconContainer, styles.infoIconContainer]}>
                <MessageSquare size={moderateScale(20)} color={colors.primary.main} />
              </View>
              <View style={styles.infoCardContent}>
                <SmartText variant="body1" style={styles.infoCardTitle}>
                  Questions or Concerns?
                </SmartText>
                <SmartText variant="caption" style={styles.infoCardSubtitle}>
                  Contact our concierge team for assistance
                </SmartText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => router.push('/chatWithConcierge' as any)}
              activeOpacity={0.7}
            >
              <SmartText variant="body2" style={styles.infoButtonText}>
                Chat with Concierge
              </SmartText>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(dependents.length > 0 ? 500 : 400)}>
          <Card padding="lg" variant="elevated" style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={[styles.iconContainer, styles.infoIconContainer]}>
                <Settings size={moderateScale(20)} color={colors.primary.main} />
              </View>
              <View style={styles.infoCardContent}>
                <SmartText variant="body1" style={styles.infoCardTitle}>
                  Membership Updates
                </SmartText>
                <SmartText variant="caption" style={styles.infoCardSubtitle}>
                  Need to update your plan or information?
                </SmartText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => router.push('/member-services' as any)}
              activeOpacity={0.7}
            >
              <SmartText variant="body2" style={styles.infoButtonText}>
                Contact Member Services
              </SmartText>
            </TouchableOpacity>
          </Card>
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
    padding: responsiveSize.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    ...platformStyles.shadowSm,
  },
  headerContent: {
    flex: 1,
    marginLeft: responsiveSize.sm,
  },
  headerTitle: {
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSize.lg,
    paddingBottom: responsiveSize.xl * 2,
  },
  card: {
    marginBottom: responsiveSize.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSize.lg,
    gap: responsiveSize.sm,
  },
  iconContainer: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  memberInfo: {
    gap: responsiveSize.md,
  },
  memberName: {
    fontWeight: '600',
    color: colors.text.primary,
    fontSize: moderateScale(16),
  },
  infoRow: {
    gap: responsiveSize.xs / 2,
  },
  label: {
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  dependentsList: {
    marginTop: responsiveSize.sm,
  },
  dependentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSize.md,
    gap: responsiveSize.md,
  },
  dependentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dependentAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: `${colors.primary.main}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dependentInfo: {
    flex: 1,
    gap: responsiveSize.xs / 2,
  },
  dependentName: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: moderateScale(15),
  },
  relationshipText: {
    color: colors.text.secondary,
    textTransform: 'capitalize',
    fontSize: moderateScale(13),
  },
  readMoreButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    padding: responsiveSize.lg,
    minHeight: MIN_TOUCH_TARGET,
    marginBottom: responsiveSize.lg,
    ...platformStyles.shadow,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveSize.sm,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.xs,
  },
  infoCard: {
    marginBottom: responsiveSize.lg,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveSize.md,
    gap: responsiveSize.md,
  },
  infoIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  infoCardContent: {
    flex: 1,
    gap: responsiveSize.xs / 2,
  },
  infoCardTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoCardSubtitle: {
    color: colors.text.secondary,
    lineHeight: moderateScale(16),
  },
  infoButton: {
    backgroundColor: `${colors.primary.main}08`,
    borderRadius: borderRadius.md,
    padding: responsiveSize.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.primary.main}20`,
  },
  infoButtonText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  coverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
    backgroundColor: `${colors.primary.main}08`,
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.primary.main}20`,
    alignSelf: 'flex-start',
  },
  coverageText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
});