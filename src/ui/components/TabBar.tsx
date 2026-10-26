import React from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from './Text';
import type { IconName } from './Button';
import { useTheme } from '../theme/Theme';
export type Tab = 'home' | 'activity' | 'insights' | 'plan' | 'more';
const tabs: { id: Tab; label: string; icon: IconName; selectedIcon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home' },
  { id: 'activity', label: 'Activity', icon: 'receipt-outline', selectedIcon: 'receipt' },
  { id: 'insights', label: 'Insights', icon: 'bar-chart-outline', selectedIcon: 'bar-chart' },
  { id: 'plan', label: 'Plan', icon: 'leaf-outline', selectedIcon: 'leaf' },
  { id: 'more', label: 'More', icon: 'grid-outline', selectedIcon: 'grid' },
];
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopColor: colors.line,
        borderTopWidth: 1,
        backgroundColor: colors.surface,
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 8,
      }}
    >
      {tabs.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: tab === item.id }}
          onPress={() => onChange(item.id)}
          style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: 54, justifyContent: 'center' }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 5,
              borderRadius: 18,
              backgroundColor: tab === item.id ? colors.accent : 'transparent',
            }}
          >
            <Ionicons
              name={tab === item.id ? item.selectedIcon : item.icon}
              size={21}
              color={tab === item.id ? colors.accentInk : colors.muted}
            />
          </View>
          <Text size={10} weight={tab === item.id ? '700' : '500'} muted={tab !== item.id}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
