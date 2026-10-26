import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { formatMoney } from '../../domain';
import { CashflowPoint, compactNaira, intervalLabel, selectedInterval } from '../chart';
import { useTheme } from '../theme/Theme';
import { Enter } from './Enter';
import { Text } from './Text';

export function CashflowChart({ points, hourly = false }: { points: CashflowPoint[]; hourly?: boolean }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(280);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedIndex = selectedInterval(points, selectedKey);
  const selected = points[selectedIndex];
  const max = Math.max(100, ...points.flatMap(point => [point.incomeKobo, point.expenseKobo]));
  const left = 50;
  const plotWidth = Math.max(50, width - left);
  const step = plotWidth / Math.max(points.length, 1);
  const bar = Math.max(.5, Math.min(13, step * .3));
  const rangeKey = `${points[0]?.key || ''}:${points[points.length - 1]?.key || ''}`;
  function move(direction: number) {
    const point = points[selectedIndex + direction];
    if (point) setSelectedKey(point.key);
  }

  return <View style={{ gap: 12 }} onLayout={event => setWidth(Math.max(100, event.nativeEvent.layout.width))}>
    <Text size={11} muted>Tap an interval to explore exact amounts.</Text>
    <Enter key={rangeKey}>
      <Svg accessible={false} width={width} height={170}>
        {[0, 1, 2].map(index => {
          const value = max * (1 - index / 2);
          const y = 18 + index * 56;
          return <React.Fragment key={index}>
            <SvgText x={left - 7} y={y + 3} fill={colors.muted} fontSize={9} textAnchor="end">{compactNaira(value)}</SvgText>
            <Line x1={left} x2={width} y1={y} y2={y} stroke={colors.line} strokeDasharray="3 5" />
          </React.Fragment>;
        })}
        {points.map((point, index) => {
          const x = left + index * step + step / 2;
          const incomeHeight = point.incomeKobo / max * 112;
          const expenseHeight = point.expenseKobo / max * 112;
          const label = hourly ? point.key.slice(11, 13) : point.key.slice(-2);
          return <React.Fragment key={point.key}>
            {index === selectedIndex && <Rect x={left + index * step} y={10} width={step} height={128} rx={Math.min(5, step / 2)} fill={colors.raised} />}
            <Rect x={x - bar - .5} y={130 - incomeHeight} width={bar} height={incomeHeight} rx={Math.min(3, bar / 2)} fill={colors.positive} />
            <Rect x={x + .5} y={130 - expenseHeight} width={bar} height={expenseHeight} rx={Math.min(3, bar / 2)} fill={colors.violet} />
            {index % Math.ceil(points.length / 6) === 0 && <SvgText x={x} y={154} fill={colors.muted} fontSize={10} textAnchor="middle">{label}</SvgText>}
            <Rect x={left + index * step} y={0} width={step} height={164} fill="transparent" onPress={() => setSelectedKey(point.key)} />
          </React.Fragment>;
        })}
      </Svg>
    </Enter>
    <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center' }}>
      {[{ label: 'Income', color: colors.positive }, { label: 'Spending', color: colors.violet }].map(item => <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: item.color }} /><Text muted size={11}>{item.label}</Text></View>)}
    </View>
    {selected && <View style={{ backgroundColor: colors.raised, borderRadius: 16, padding: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous interval" accessibilityState={{ disabled: selectedIndex === 0 }} disabled={selectedIndex === 0} onPress={() => move(-1)} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === 0 ? .35 : 1, backgroundColor: colors.surface }}><Ionicons name="chevron-back" size={20} color={colors.ink} /></Pressable>
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}><Text size={12} weight="700" style={{ textAlign: 'center' }}>{intervalLabel(selected.key)}</Text><Text size={10} muted>Interval {selectedIndex + 1} of {points.length}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Next interval" accessibilityState={{ disabled: selectedIndex === points.length - 1 }} disabled={selectedIndex === points.length - 1} onPress={() => move(1)} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', opacity: selectedIndex === points.length - 1 ? .35 : 1, backgroundColor: colors.surface }}><Ionicons name="chevron-forward" size={20} color={colors.ink} /></Pressable>
      </View>
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${intervalLabel(selected.key)}. Income ${formatMoney(selected.incomeKobo)}. Spending ${formatMoney(selected.expenseKobo)}.`} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 5 }}>
        <View style={{ flex: 1, gap: 3 }}><Text size={11} muted>Income</Text><Text size={16} weight="700" color={colors.positive}>{formatMoney(selected.incomeKobo)}</Text></View>
        <View style={{ flex: 1, gap: 3 }}><Text size={11} muted>Spending</Text><Text size={16} weight="700">{formatMoney(selected.expenseKobo)}</Text></View>
      </View>
    </View>}
  </View>;
}
