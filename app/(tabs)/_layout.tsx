import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import {
  Home as HomeIcon,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react-native';
import { Platform, View, Pressable, StyleSheet } from 'react-native';
import { BlurView as ExpoBlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles } from '@/utils/scaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function TabLayout() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = moderateScale(60) + (Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, responsiveSize.sm));

  if (loading) return null;
  if (!session) return <Redirect href="/auth/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: [
          styles.tabBarBase,
          {
            height: tabBarHeight,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, responsiveSize.sm),
            paddingTop: responsiveSize.sm,
          },
          Platform.select({ ios: styles.tabBarIOS, android: styles.tabBarAndroid }),
        ],
        tabBarLabelStyle: {
          fontSize: moderateScale(11),
          fontWeight: '600',
          marginTop: responsiveSize.xs / 4,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          marginTop: responsiveSize.xs / 4,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <ExpoBlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={StyleSheet.absoluteFill} />
          ),
        tabBarButton: ({ children, onPress, accessibilityState }) => {
          const focused = accessibilityState?.selected ?? false;
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [
              {
                scale: withSpring(focused ? 1.08 : 1, {
                  mass: 1,
                  damping: 15,
                  stiffness: 200,
                }),
              },
            ],
            backgroundColor: withTiming(
              focused ? `${colors.primary.main}12` : 'transparent',
              { duration: 200 }
            ),
          }));
          return (
            <Pressable
              onPress={onPress}
              style={styles.tabPressable}
              android_ripple={{ color: `${colors.primary.main}15`, borderless: false }}
            >
              <AnimatedView style={[styles.tabAnimated, animatedStyle]}>
                {children}
              </AnimatedView>
            </Pressable>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon size={moderateScale(24)} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Concierge',
          tabBarIcon: ({ color }) => <MessageCircle size={moderateScale(24)} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserIcon size={moderateScale(24)} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBase: {
    borderTopWidth: 0.5,
    borderTopColor: colors.gray[200],
    ...platformStyles.shadowSm,
  },
  tabBarIOS: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  tabBarAndroid: {
    backgroundColor: colors.background.default,
    elevation: moderateScale(8),
  },
  tabPressable: {
    flex: 1,
    borderRadius: borderRadius.md,
    marginHorizontal: responsiveSize.xs / 2,
    overflow: 'hidden',
  },
  tabAnimated: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: responsiveSize.xs,
    paddingHorizontal: responsiveSize.sm,
  },
});
