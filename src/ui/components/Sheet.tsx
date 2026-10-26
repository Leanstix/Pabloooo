import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/Theme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Text } from './Text';
export function Sheet({
  title,
  subtitle,
  visible,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={{ flex: 1, minHeight: 35 }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            maxHeight: '92%',
            backgroundColor: colors.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.line,
              alignSelf: 'center',
              marginTop: 10,
            }}
          />
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text size={26} weight="700" accessibilityRole="header">
                {title}
              </Text>
              {!!subtitle && (
                <Text muted size={13}>
                  {subtitle}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ height: 48, width: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={24} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 40, gap: 18 }}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
