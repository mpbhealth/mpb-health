import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Pressable } from 'react-native';

type Variant = 'filled' | 'ghost' | 'clear';

interface BackButtonProps {
  onPress: () => void;
  color?: string;              // icon color
  size?: number;               // icon size
  bgColor?: string;            // background color for filled/ghost
  variant?: Variant;           // visual style
  disabled?: boolean;
  haptics?: boolean;           // iOS light haptic on press (default true on iOS)
  testID?: string;
}

export function BackButton({
  onPress,
  color = colors.text.primary,
  size = 22,
  bgColor = '#f3f4f6',
  variant = 'filled',
  disabled = false,
  haptics = Platform.OS === 'ios',
  testID = 'back-button',
}: BackButtonProps) {
  const scale = useSharedValue(1);
  const hovered = useSharedValue(0);
  const focused = useSharedValue(0);

  const containerStyle = useMemo(() => {
    const isGhost = variant === 'ghost';
    const isClear = variant === 'clear';
    return [
      styles.baseContainer,
      !isClear && { backgroundColor: bgColor },
      isGhost && styles.ghostBorder,
      disabled && { opacity: 0.5 },
      Platform.OS === 'ios' && styles.iosShadow,
    ];
  }, [bgColor, variant, disabled]);

  const animatedStyle = useAnimatedStyle(() => {
    // Slightly scale on press; tint on hover/focus for web
    return {
      transform: [{ scale: scale.value }],
      ...(Platform.OS === 'web'
        ? {
            boxShadow:
              focused.value > 0
                ? '0 0 0 3px rgba(8,145,178,0.35)'
                : 'none',
            // hover tint (subtle)
            backgroundColor:
              hovered.value > 0 ? 'rgba(0,0,0,0.03)' : undefined,
          }
        : {}),
    };
  });

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        testID={testID}
        onPress={() => {
          if (disabled) return;
          onPress();
        }}
        onPressIn={() => {
          if (!disabled) scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 300 });
        }}
        onHoverIn={() => {
          if (Platform.OS === 'web') hovered.value = 1;
        }}
        onHoverOut={() => {
          if (Platform.OS === 'web') hovered.value = 0;
        }}
        onFocus={() => {
          if (Platform.OS === 'web') focused.value = 1;
        }}
        onBlur={() => {
          if (Platform.OS === 'web') focused.value = 0;
        }}
        android_ripple={
          variant !== 'clear'
            ? { color: 'rgba(0,0,0,0.08)', borderless: false }
            : undefined
        }
        style={({ pressed }) => [
          styles.pressable,
          containerStyle,
          pressed && Platform.OS !== 'web' && { transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Navigates to the previous screen"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        disabled={disabled}
      >
        <View style={styles.iconRow}>
          <ArrowLeft size={size} color={color} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const SIZE = 40;

const styles = StyleSheet.create({
  wrapper: {
    // wrapper lets Animated.View handle scale/hover effects
    width: SIZE,
    height: SIZE,
    borderRadius: borderRadius.lg,
  },
  pressable: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // for Android ripple clipping
  },
  baseContainer: {
    // default “chip” background
    backgroundColor: '#f3f4f6',
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  iosShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // avoid RN gap compatibility issues across platforms
    paddingHorizontal: spacing.xs,
  },
});
