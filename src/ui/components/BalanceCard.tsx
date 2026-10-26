import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '../../domain';
import { Text } from './Text';
import { useTheme } from '../theme/Theme';
export function BalanceCard({ balance, income, spending, period }: { balance: number; income: number; spending: number; period: string }) {
  const { colors } = useTheme();
  return <LinearGradient colors={[colors.hero, '#2A5740']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 24, borderRadius: 28, gap: 22, overflow: 'hidden' }}><View pointerEvents="none" style={{ position: 'absolute', right: -48, top: -62, width: 200, height: 200, borderRadius: 100, borderWidth: 35, borderColor: 'rgba(198,243,107,.07)' }} /><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text size={13} color="#C5D7CB">Cycle balance</Text><View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.09)', padding: 7, borderRadius: 20 }}><Ionicons name="shield-checkmark-outline" size={12} color="#C6F36B" /><Text size={10} color="#DDEAD9">ON DEVICE</Text></View></View><View style={{ gap: 5 }}><Text size={37} weight="700" color={colors.heroText} adjustsFontSizeToFit numberOfLines={1} style={{ letterSpacing: -1.4 }}>{formatMoney(balance)}</Text><Text size={12} color="#B6CBBB">{period}</Text></View><View style={{ height: 1, backgroundColor: 'rgba(255,255,255,.13)' }} /><View style={{ flexDirection: 'row', gap: 20 }}>{[{ label: 'Money in', value: income, icon: 'arrow-down' as const }, { label: 'Money out', value: spending, icon: 'arrow-up' as const }].map(item => <View key={item.label} style={{ flex: 1, gap: 7 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Ionicons name={item.icon} size={14} color="#C6F36B" /><Text size={12} color="#C5D7CB">{item.label}</Text></View><Text size={19} weight="600" color="#F3F6EB" adjustsFontSizeToFit numberOfLines={1}>{formatMoney(item.value)}</Text></View>)}</View></LinearGradient>;
}
