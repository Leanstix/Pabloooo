import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/Theme';
import { Button, IconName } from './Button';
import { Text } from './Text';
export function EmptyState({
  title,
  body,
  icon = 'leaf-outline',
  action,
  onPress,
}: {
  title: string;
  body: string;
  icon?: IconName;
  action?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, gap: 12 }}>
      <View
        style={{
          height: 64,
          width: 64,
          borderRadius: 24,
          backgroundColor: colors.raised,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={28} color={colors.positive} />
      </View>
      <Text size={18} weight="700" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text muted size={14} style={{ textAlign: 'center', maxWidth: 290 }}>
        {body}
      </Text>
      {!!action && !!onPress && <Button label={action} onPress={onPress} variant="secondary" />}
    </View>
  );
}
