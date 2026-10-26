import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
export const categoryColors = ['#2D8058', '#A65B35', '#8264AB', '#BD5262', '#337E9A', '#8A7C2B'];
export function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <View style={{ gap: 8 }}><Text size={13} weight="600">Category color</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{categoryColors.map(color => <Pressable accessibilityRole="button" accessibilityLabel={`Color ${color}`} accessibilityState={{ selected: color === value }} key={color} onPress={() => onChange(color)} style={{ height: 44, width: 44, backgroundColor: color, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>{color === value && <Ionicons name="checkmark" color="#FFFFFF" size={22} />}</Pressable>)}</View></View>;
}
