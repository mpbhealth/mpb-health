import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import {
  Home as HomeIcon,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react-native';
import {
  Platform,
  View,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/hooks/useAuth';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useDeferredBusyIndicator } from '@/hooks/useDeferredBusyIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles, androidBarElevation } from '@/utils/scaling';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedView = Animated.createAnimatedComponent(View);

/** Material 3 bottom navigation active indicator (horizontal pill), dp-aligned ~64×32 zone */
const ACTIVE_PILL_HORIZONTAL_PADDING = moderateScale(14);
const ACTIVE_PILL_VERTICAL_PADDING = moderateScale(6);
const RIPPLE_PRIMARY = `${colors.primary.main}18`;

type MaterialTabBarButtonProps = {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  accessibilityState?: { selected?: boolean };
  testID?: string;
  style?: StyleProp<ViewStyle>;
  href?: string;
};

/**
 * M3-style tab trigger: tonal container when selected, ripple, light scale — hooks live in a real component.
 */
function MaterialTabBarButton({
  children,
  onPress,
  onLongPress,
  accessibilityState,
  testID,
  style,
}: MaterialTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(focused ? 1.02 : 1, {
          mass: 1,
          damping: 16,
          stiffness: 220,
        }),
      },
    ],
    backgroundColor: withTiming(focused ? `${colors.primary.main}14` : 'transparent', { duration: 180 }),
  }));

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabPressable, style]}
      android_ripple={{ color: RIPPLE_PRIMARY, borderless: false, foreground: true }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
    >
      <AnimatedView style={[styles.tabAnimated, animatedStyle]}>{children}</AnimatedView>
    </Pressable>
  );
}

/**
 * iOS: native `UITabBarController` via Expo `NativeTabs` — system tab bar with standard blur
 * and (on iOS 26+, when built with a matching SDK) the Liquid Glass tab bar.
 * Android / others: JS `Tabs` with Material 3–inspired bottom navigation (surface, elevation, capsule selection).
 */
function IosNativeTabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.primary.main}
      labelStyle={{
        default: {
          color: colors.gray[500],
          fontWeight: '600',
        },
        selected: {
          color: colors.primary.main,
          fontWeight: '600',
        },
      }}
      iconColor={{
        default: colors.gray[500],
        selected: colors.primary.main,
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Label>Concierge</Label>
        <Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/**
 * Full-width glass bar (same x-position as before; only the top corners are rounded).
 * Blur can look identical to a solid if nothing paints behind the tab region — we combine
 * native blur (when available) with a light frost + edge highlights so it reads as “glass”
 * even over the default paper background.
 */
function AndroidTabBarGlassBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <BlurView
        tint="light"
        intensity={82}
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={2.2}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.androidGlassFrost} pointerEvents="none" />
      <View style={styles.androidGlassTopHighlight} pointerEvents="none" />
      <View style={styles.androidGlassTopHairline} pointerEvents="none" />
    </View>
  );
}

function AndroidAndFallbackTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, responsiveSize.sm);
  const tabBarHeight = moderateScale(56) + bottomPad;
  const isAndroidGlass = Platform.OS === 'android';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.main,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          isAndroidGlass ? styles.tabBarAndroidGlassShell : styles.tabBarBase,
          isAndroidGlass ? null : styles.tabBarMaterialSurface,
          isAndroidGlass ? styles.tabBarAndroidGlassElevation : null,
          {
            height: tabBarHeight,
            paddingBottom: bottomPad,
            paddingTop: responsiveSize.xs,
            paddingHorizontal: responsiveSize.xs,
          },
        ],
        tabBarLabelStyle: {
          fontSize: moderateScale(12),
          fontWeight: '600',
          marginTop: moderateScale(2),
          letterSpacing: 0.1,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: moderateScale(48),
          borderRadius: borderRadius.full,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarBackground: () =>
          isAndroidGlass ? <AndroidTabBarGlassBackground /> : <View style={StyleSheet.absoluteFill} />,
        tabBarButton: (props) => (
          <MaterialTabBarButton
            {...props}
            onPress={(e) => {
              try {
                const Haptics = require('expo-haptics');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {
                // expo-haptics optional
              }
              props.onPress?.(e);
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon size={moderateScale(24)} color={color} strokeWidth={2} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Concierge',
          tabBarIcon: ({ color }) => <MessageCircle size={moderateScale(24)} color={color} strokeWidth={2} />,
          tabBarAccessibilityLabel: 'Concierge chat',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserIcon size={moderateScale(24)} color={color} strokeWidth={2} />,
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const showLoadingChrome = useDeferredBusyIndicator(loading, 260);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.paper }}>
        {showLoadingChrome ? <LoadingIndicator /> : null}
      </View>
    );
  }
  if (!session) return <Redirect href="/auth/sign-in" />;

  if (Platform.OS === 'ios') {
    return <IosNativeTabsLayout />;
  }

  return <AndroidAndFallbackTabsLayout />;
}

const styles = StyleSheet.create({
  tabBarBase: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
    ...platformStyles.shadowSm,
  },
  /** Full-width glass: transparent shell; top corners only (not a floating centered dock). */
  tabBarAndroidGlassShell: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderTopLeftRadius: moderateScale(22),
    borderTopRightRadius: moderateScale(22),
    overflow: 'hidden',
  },
  tabBarAndroidGlassElevation: {
    ...androidBarElevation,
  },
  /** Lets blur read as frosted even over a flat paper scaffold. */
  androidGlassFrost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  /** Specular “lip” so the bar separates from content without a heavy border. */
  androidGlassTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(1),
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  androidGlassTopHairline: {
    position: 'absolute',
    top: moderateScale(1),
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 23, 42, 0.07)',
  },
  /** M3 “surface” slightly lifted from page background */
  tabBarMaterialSurface: {
    backgroundColor: colors.background.subtle,
  },
  tabPressable: {
    flex: 1,
    borderRadius: borderRadius.full,
    marginHorizontal: responsiveSize.xs / 3,
    overflow: 'hidden',
  },
  tabAnimated: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: ACTIVE_PILL_VERTICAL_PADDING,
    paddingHorizontal: ACTIVE_PILL_HORIZONTAL_PADDING,
  },
});
