import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from './Text';
import { Enter } from './Enter';
export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 34, gap: 24 }}
    >
      <Enter>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            {eyebrow && (
              <Text size={11} weight="700" muted style={{ letterSpacing: 2 }}>
                {eyebrow.toUpperCase()}
              </Text>
            )}
            <Text accessibilityRole="header" size={32} weight="800" style={{ letterSpacing: -0.9 }}>
              {title}
            </Text>
            {!!subtitle && (
              <Text size={14} muted>
                {subtitle}
              </Text>
            )}
          </View>
          {action}
        </View>
      </Enter>
      {children}
    </ScrollView>
  );
}
