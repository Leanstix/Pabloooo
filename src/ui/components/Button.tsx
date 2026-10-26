import React, { useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Button({ label, onPress, icon, variant = 'primary', disabled, busy, style }: { label: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; busy?: boolean; style?: ViewStyle }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const color = variant === 'primary' ? colors.accentInk : variant === 'danger' ? colors.negative : colors.ink;
  const animate = (value: number) => { if (!reduced) Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30 }).start(); };
  return <Animated.View style={[{ transform: [{ scale }], opacity: disabled ? .45 : 1 }, style]}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }} disabled={disabled || busy} onPress={onPress} onPressIn={() => animate(.97)} onPressOut={() => animate(1)} style={{ minHeight: 48, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 16, backgroundColor: variant === 'primary' ? colors.accent : variant === 'ghost' ? 'transparent' : colors.raised, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{busy ? <ActivityIndicator color={color} /> : icon ? <Ionicons name={icon} size={19} color={color} /> : null}<Text weight="700" color={color}>{label}</Text></Pressable></Animated.View>;
}
