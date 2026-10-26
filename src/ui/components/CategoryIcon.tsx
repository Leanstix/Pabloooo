import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '../../domain/types';
import { useTheme } from '../theme/Theme';
export function CategoryIcon({ category, size = 44 }: { category?: Category; size?: number }) {
  const { colors } = useTheme();
  const glyphs = Ionicons.glyphMap as Record<string, number>;
  const icon = category?.icon && category.icon in glyphs ? category.icon : category?.kind === 'income' ? 'arrow-down-outline' : 'pricetag-outline';
  return <View style={{ width: size, height: size, borderRadius: size * .34, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={size * .46} color={category?.color || colors.positive} /></View>;
}
