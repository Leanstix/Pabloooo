import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
export function Section({
  title,
  detail,
  action,
  onPress,
}: {
  title: string;
  detail?: string;
  action?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text accessibilityRole="header" size={21} weight="700">
          {title}
        </Text>
        {!!detail && (
          <Text size={12} muted>
            {detail}
          </Text>
        )}
      </View>
      {!!action && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action} ${title.toLowerCase()}`}
          onPress={onPress}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text size={13} weight="600" color={colors.positive}>
            {action} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
