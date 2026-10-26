import React from 'react';
import { Text as NativeText, TextProps } from 'react-native';
import { useTheme } from '../theme/Theme';
type Props = TextProps & {
  size?: number;
  weight?: '400' | '500' | '600' | '700' | '800' | '900';
  muted?: boolean;
  color?: string;
};
export function Text({ size = 15, weight = '400', muted, color, style, ...props }: Props) {
  const { colors } = useTheme();
  return (
    <NativeText
      {...props}
      style={[
        {
          color: color || (muted ? colors.muted : colors.ink),
          fontSize: size,
          fontWeight: weight,
          lineHeight: size * 1.35,
        },
        style,
      ]}
    />
  );
}
