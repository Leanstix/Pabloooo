import React from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { IconName } from './Button';
import { Text } from './Text';
import { useTheme } from '../theme/Theme';
export function MenuRow({ title, subtitle, icon, onPress, trailing }: { title: string; subtitle?: string; icon: IconName; onPress?: () => void; trailing?: React.ReactNode }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 66, paddingVertical: 8 }}><View style={{ width: 43, height: 43, borderRadius: 15, backgroundColor: colors.raised, justifyContent: 'center', alignItems: 'center' }}><Ionicons name={icon} size={21} color={colors.positive} /></View><View style={{ flex: 1, gap: 3 }}><Text weight="600">{title}</Text>{subtitle && <Text size={12} muted>{subtitle}</Text>}</View>{trailing || (onPress && <Ionicons name="chevron-forward" size={17} color={colors.muted} />)}</Pressable>;
}
