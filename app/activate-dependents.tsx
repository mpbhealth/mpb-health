import React, { useState, useEffect } from 'react';
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
import { Users, ChevronRight, Calendar, User, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface InactiveDependent {
  member_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  dob: string;
  product_id: string;
  product_label: string;
  product_benefit: string;
  agent_id: string;
}

interface ActiveDependent {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  dob: string;
  email: string;
}

export default function ActivateDependentsScreen() {
  const router = useRouter();
  const { userData, loading: userLoading } = useUserData();
  const [inactiveDependents, setInactiveDependents] = useState<InactiveDependent[]>([]);
  const [activeDependents, setActiveDependents] = useState<ActiveDependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDependents() {
      if (!userData?.member_id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch inactive dependents from members table
        const { data: inactiveData, error: inactiveError } = await supabase
          .from('members')
          .select('*')
          .eq('primary_id', userData.member_id)
          .eq('is_primary', false);

        if (inactiveError) {
          throw inactiveError;
        }

        // Fetch active dependents from users table
        const { data: activeData, error: activeError } = await supabase
          .from('users')
          .select('id, member_id, first_name, last_name, relationship, dob, email')
          .eq('primary_id', userData.id)
          .eq('is_primary', false);

        if (activeError) {
          throw activeError;
        }

        setInactiveDependents(inactiveData || []);
        setActiveDependents(activeData || []);
      } catch (err) {
        console.error('Error fetching dependents:', err);
        setError('Unable to load dependents');
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchDependents();
    }
  }, [userData?.member_id, userData?.id, userLoading]);

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const canActivateDependent = (dependent: InactiveDependent) => {
    if (dependent.relationship.toLowerCase() === 'child') {
      const age = calculateAge(dependent.dob);
      return age >= 18 && age <= 26;
    }
    return true; // Other relationships can always be activated
  };

  const handleDependentPress = (dependent: InactiveDependent) => {
    if (!canActivateDependent(dependent)) {
      const age = calculateAge(dependent.dob);
      Alert.alert(
        'Cannot Activate Account',
        `Child dependents must be between 18-26 years old to create an account. Current age: ${age} years.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    router.push({
      pathname: '/activate-dependent-account',
      params: {
        memberId: dependent.member_id,
        firstName: dependent.first_name,
        lastName: dependent.last_name,
        relationship: dependent.relationship,
        productId: dependent.product_id,
        productLabel: dependent.product_label,
        productBenefit: dependent.product_benefit,
        agentId: dependent.agent_id,
        dob: dependent.dob,
        primaryId: userData.id, // Pass the primary user's auth UUID
      },
    });
  };

  const totalDependents = inactiveDependents.length + activeDependents.length;

  if (userLoading || loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={styles.header} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Activate Dependents</Text>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={styles.introCard} entering={FadeInUp.delay(200)}>
          <Users size={24} color={colors.primary.main} />
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Set Up Dependent Accounts</Text>
            <Text style={styles.introText}>
              Activate accounts for your eligible dependents. They'll be able to access their own personalized health portal.
            </Text>
          </View>
        </Animated.View>

        {error ? (
          <Animated.View style={styles.errorCard} entering={FadeInUp.delay(300)}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : totalDependents === 0 ? (
          <Animated.View style={styles.emptyCard} entering={FadeInUp.delay(300)}>
            <Users size={48} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Dependents Found</Text>
            <Text style={styles.emptyText}>
              You don't have any dependents that need account activation.
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.dependentsGrid}>
            {/* Active Dependents */}
            {activeDependents.map((dependent, index) => (
              <AnimatedTouchableOpacity
                key={`active-${dependent.id}`}
                style={[styles.dependentCard, styles.activeDependentCard]}
                onPress={() => {
                  Alert.alert(
                    'Account Already Active',
                    `${dependent.first_name} ${dependent.last_name} already has an active account and can sign in to the app.`,
                    [{ text: 'OK', style: 'default' }]
                  );
                }}
                entering={FadeInUp.delay(300 + index * 100)}
                layout={Layout.springify()}
              >
                <View style={styles.dependentContent}>
                  <View style={[styles.dependentIconContainer, { backgroundColor: `${colors.status.success}15` }]}>
                    <CheckCircle size={24} color={colors.status.success} />
                  </View>
                  <View style={styles.dependentInfo}>
                    <Text style={styles.dependentName}>
                      {dependent.first_name} {dependent.last_name}
                    </Text>
                    <Text style={styles.dependentRelationship}>
                      {dependent.relationship} • Activated
                    </Text>
                    <Text style={styles.activatedText}>
                      Can sign in with: {dependent.email}
                    </Text>
                  </View>
                </View>
              </AnimatedTouchableOpacity>
            ))}

            {/* Inactive Dependents */}
            {inactiveDependents.map((dependent, index) => {
              const canActivate = canActivateDependent(dependent);
              const age = dependent.relationship.toLowerCase() === 'child' ? calculateAge(dependent.dob) : null;

              return (
                <AnimatedTouchableOpacity
                  key={`inactive-${dependent.member_id}`}
                  style={[
                    styles.dependentCard,
                    !canActivate && styles.dependentCardDisabled,
                  ]}
                  onPress={() => handleDependentPress(dependent)}
                  disabled={!canActivate}
                  entering={FadeInUp.delay(300 + (activeDependents.length + index) * 100)}
                  layout={Layout.springify()}
                >
                  <View style={styles.dependentContent}>
                    <View style={[
                      styles.dependentIconContainer,
                      { backgroundColor: canActivate ? `${colors.primary.main}15` : `${colors.gray[300]}15` }
                    ]}>
                      <User size={24} color={canActivate ? colors.primary.main : colors.gray[300]} />
                    </View>
                    <View style={styles.dependentInfo}>
                      <Text style={[
                        styles.dependentName,
                        !canActivate && styles.dependentNameDisabled
                      ]}>
                        {dependent.first_name} {dependent.last_name}
                      </Text>
                      <Text style={[
                        styles.dependentRelationship,
                        !canActivate && styles.dependentRelationshipDisabled
                      ]}>
                        {dependent.relationship} • Needs Activation
                        {age !== null && ` • Age ${age}`}
                      </Text>
                      {!canActivate && age !== null && (
                        <Text style={styles.ageRestrictionText}>
                          Must be 18-26 years old
                        </Text>
                      )}
                    </View>
                  </View>
                  {canActivate && (
                    <ChevronRight size={20} color={colors.gray[400]} />
                  )}
                </AnimatedTouchableOpacity>
              );
            })}
          </View>
        )}
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
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  errorCard: {
    backgroundColor: `${colors.status.error}10`,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.status.error,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dependentsGrid: {
    gap: spacing.md,
  },
  dependentCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  dependentCardDisabled: {
    opacity: 0.6,
  },
  activeDependentCard: {
    borderWidth: 1,
    borderColor: colors.status.success,
    backgroundColor: `${colors.status.success}05`,
  },
  dependentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dependentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dependentInfo: {
    flex: 1,
  },
  dependentName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  dependentNameDisabled: {
    color: colors.gray[400],
  },
  dependentRelationship: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  dependentRelationshipDisabled: {
    color: colors.gray[400],
  },
  ageRestrictionText: {
    ...typography.caption,
    color: colors.status.warning,
    marginTop: spacing.xs / 2,
  },
  activatedText: {
    ...typography.caption,
    color: colors.status.success,
    marginTop: spacing.xs / 2,
  },
});