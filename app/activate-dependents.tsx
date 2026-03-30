import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, ChevronRight, User, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/lib/supabase';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles, cardChromeMd } from '@/utils/scaling';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { screenChrome } from '@/utils/screenChrome';

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
  active_date: string | null;
  inactive_date: string | null;
  inactive_reason: string | null;
  is_active: boolean | null;
  created_date: string | null;
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
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
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
    return true; // Other relationships can always create app login
  };

  const handleDependentPress = (dependent: InactiveDependent) => {
    if (!canActivateDependent(dependent)) {
      const age = calculateAge(dependent.dob);
      Alert.alert(
        'Cannot Create App Login',
        `Child dependents must be between 18-26 years old to create an app login. Current age: ${age} years.`,
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
        primaryId: userData.member_id,
        activeDate: dependent.active_date || '',
        inactiveDate: dependent.inactive_date || '',
        inactiveReason: dependent.inactive_reason || '',
        isActive: dependent.is_active !== null ? String(dependent.is_active) : '',
        createdDate: dependent.created_date || '',
      },
    });
  };

  const totalDependents = inactiveDependents.length + activeDependents.length;

  if (userLoading || loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={screenChrome.container}>
      <Animated.View style={[styles.header, { paddingTop: headerPaddingTop }]} entering={FadeInDown.delay(100)}>
        <BackButton onPress={() => router.back()} />
        <SmartText variant="h2" style={styles.title} maxLines={1}>Create App Login</SmartText>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[screenChrome.scrollContent, styles.scrollPad, { paddingBottom: scrollContentPaddingBottom + responsiveSize.xxl }]}
      >
        <Animated.View style={styles.introCard} entering={FadeInUp.delay(200)}>
          <Users size={moderateScale(24)} color={colors.primary.main} />
          <View style={styles.introContent}>
            <SmartText variant="h3" style={styles.introTitle} maxLines={2}>Set Up App Access for Dependents</SmartText>
            <SmartText variant="body1" style={styles.introText} maxLines={3}>
              Create login credentials for your eligible dependents so they can access their own personalized health portal in the app.
            </SmartText>
          </View>
        </Animated.View>

        {error ? (
          <Animated.View style={styles.errorCard} entering={FadeInUp.delay(300)}>
            <SmartText variant="body1" style={styles.errorText} maxLines={2}>{error}</SmartText>
          </Animated.View>
        ) : totalDependents === 0 ? (
          <Animated.View entering={FadeInUp.delay(300)}>
            <EmptyState
              icon={<Users size={moderateScale(48)} color={colors.gray[300]} />}
              message="No Dependents Found"
              subtitle="You don't have any dependents that need app login setup."
            />
          </Animated.View>
        ) : (
          <View style={styles.dependentsGrid}>
            {/* Active Dependents */}
            {activeDependents.map((dependent, index) => (
              <Animated.View
                key={`active-${dependent.id}`}
                entering={FadeInUp.delay(300 + index * 100)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  style={[styles.dependentCard, styles.activeDependentCard]}
                  onPress={() => {
                    Alert.alert(
                      'Login Already Created',
                      `${dependent.first_name} ${dependent.last_name} already has an app login and can sign in using their credentials.`,
                      [{ text: 'OK', style: 'default' }]
                    );
                  }}
                >
                  <View style={styles.dependentContent}>
                    <View style={[styles.dependentIconContainer, { backgroundColor: `${colors.status.success}15` }]}>
                      <CheckCircle size={moderateScale(24)} color={colors.status.success} />
                    </View>
                    <View style={styles.dependentInfo}>
                      <SmartText variant="h4" style={styles.dependentName} maxLines={1}>
                        {dependent.first_name} {dependent.last_name}
                      </SmartText>
                      <SmartText variant="body2" style={styles.dependentRelationship} maxLines={1}>
                        {dependent.relationship} • Login Created
                      </SmartText>
                      <SmartText variant="caption" style={styles.activatedText} maxLines={1}>
                        Can sign in with: {dependent.email}
                      </SmartText>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Inactive Dependents */}
            {inactiveDependents.map((dependent, index) => {
              const canActivate = canActivateDependent(dependent);
              const age = dependent.relationship.toLowerCase() === 'child' ? calculateAge(dependent.dob) : null;

              return (
                <Animated.View
                  key={`inactive-${dependent.member_id}`}
                  entering={FadeInUp.delay(300 + (activeDependents.length + index) * 100)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    style={[
                      styles.dependentCard,
                      !canActivate && styles.dependentCardDisabled,
                    ]}
                    onPress={() => handleDependentPress(dependent)}
                    disabled={!canActivate}
                  >
                  <View style={styles.dependentContent}>
                    <View style={[
                      styles.dependentIconContainer,
                      { backgroundColor: canActivate ? `${colors.primary.main}15` : `${colors.gray[300]}15` }
                    ]}>
                      <User size={moderateScale(24)} color={canActivate ? colors.primary.main : colors.gray[300]} />
                    </View>
                    <View style={styles.dependentInfo}>
                      <SmartText
                        variant="h4"
                        style={[
                          styles.dependentName,
                          !canActivate && styles.dependentNameDisabled
                        ]}
                        maxLines={1}
                      >
                        {dependent.first_name} {dependent.last_name}
                      </SmartText>
                      <SmartText
                        variant="body2"
                        style={[
                          styles.dependentRelationship,
                          !canActivate && styles.dependentRelationshipDisabled
                        ]}
                        maxLines={1}
                      >
                        {dependent.relationship} • Login Not Created
                        {age !== null && ` • Age ${age}`}
                      </SmartText>
                      {!canActivate && age !== null && (
                        <SmartText variant="caption" style={styles.ageRestrictionText} maxLines={1}>
                          Must be 18-26 years old
                        </SmartText>
                      )}
                    </View>
                  </View>
                  {canActivate && (
                    <ChevronRight size={moderateScale(20)} color={colors.gray[400]} />
                  )}
                </TouchableOpacity>
              </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.lg,
    paddingBottom: responsiveSize.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  title: {
    color: colors.text.primary,
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: responsiveSize.lg,
  },
  introCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: responsiveSize.xl,
    marginBottom: responsiveSize.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.md,
    ...cardChromeMd,
  },
  introContent: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs,
  },
  introTitle: {
    color: colors.text.primary,
  },
  introText: {
    color: colors.text.secondary,
  },
  errorCard: {
    backgroundColor: `${colors.status.error}10`,
    borderRadius: borderRadius.xl,
    padding: responsiveSize.xl,
    alignItems: 'center',
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
  },
  dependentsGrid: {
    gap: responsiveSize.md,
  },
  dependentCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    padding: responsiveSize.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...cardChromeMd,
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
    marginRight: responsiveSize.sm,
    minWidth: 0,
  },
  dependentIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize.md,
  },
  dependentInfo: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  dependentName: {
    color: colors.text.primary,
  },
  dependentNameDisabled: {
    color: colors.gray[400],
  },
  dependentRelationship: {
    color: colors.text.secondary,
  },
  dependentRelationshipDisabled: {
    color: colors.gray[400],
  },
  ageRestrictionText: {
    color: colors.status.warning,
  },
  activatedText: {
    color: colors.status.success,
  },
});