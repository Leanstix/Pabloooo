import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/Theme';
import { Text } from './Text';
type Point = { key: string; incomeKobo: number; expenseKobo: number };
export function CashflowChart({ points, hourly = false }: { points: Point[]; hourly?: boolean }) {
  const { colors } = useTheme(); const [width, setWidth] = useState(280);
  const max = Math.max(100, ...points.flatMap(p => [p.incomeKobo, p.expenseKobo]));
  const step = width / Math.max(points.length, 1); const bar = Math.max(1, Math.min(13, step * .3));
  return <View onLayout={e => setWidth(Math.max(100, e.nativeEvent.layout.width))} accessible accessibilityLabel={`Cash flow chart. ${points.length} ${hourly ? 'hourly' : 'period'} intervals. Green is income and purple is spending.`}><Svg width={width} height={170}>{[0, 1, 2].map(i => <Line key={i} x1={0} x2={width} y1={15 + i * 55} y2={15 + i * 55} stroke={colors.line} strokeDasharray="3 5" />)}{points.map((point, i) => { const x = i * step + step / 2; const incomeHeight = point.incomeKobo / max * 112; const expenseHeight = point.expenseKobo / max * 112; const label = hourly ? point.key.slice(-2) : point.key.length === 7 ? point.key.slice(-2) : point.key.slice(-2); return <React.Fragment key={point.key}><Rect x={x - bar - 1} y={130 - incomeHeight} width={bar} height={incomeHeight} rx={Math.min(3, bar / 2)} fill={colors.positive} /><Rect x={x + 1} y={130 - expenseHeight} width={bar} height={expenseHeight} rx={Math.min(3, bar / 2)} fill={colors.violet} />{i % Math.ceil(points.length / 7) === 0 && <SvgText x={x} y={154} fill={colors.muted} fontSize={10} textAnchor="middle">{label}</SvgText>}</React.Fragment>; })}</Svg><View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center' }}><Text muted size={11}>● Income</Text><Text size={11} color={colors.muted}>◼ Spending</Text></View></View>;
}
