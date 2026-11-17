import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { C, RISK_COLORS } from '../theme';
import type { RiskResult } from '../engine/cycle';

// Semicircle gauge with 5 coloured bands and a needle. The needle shows a level, not a probability.
const R = 90, CX = 110, CY = 110;
const pt = (deg: number, r: number) => [CX + r * Math.cos((Math.PI * (180 - deg)) / 180), CY - r * Math.sin((Math.PI * (180 - deg)) / 180)];

export default function RiskMeter({ risk, compact }: { risk: RiskResult; compact?: boolean }) {
  const w = compact ? 118 : 240;
  const [nx, ny] = pt((risk.percent / 100) * 180, 72);
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={w * 0.58} viewBox="0 0 220 125">
        {RISK_COLORS.map((col, i) => {
          const a0 = i * 36 + 2, a1 = (i + 1) * 36 - 2;
          const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
          return <Path key={i} d={`M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={col} strokeWidth={20} fill="none" strokeLinecap="round" />;
        })}
        <Line x1={CX} y1={CY} x2={nx} y2={ny} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        <Path d={`M${CX - 8} ${CY} a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0`} fill={C.ink} />
      </Svg>
      <Text style={{ fontSize: compact ? 14 : 22, fontWeight: '900', color: RISK_COLORS[risk.level], marginTop: -2 }}>{risk.label}</Text>
      {risk.uncertain && <Text style={{ fontSize: 11, color: C.sub }}>Less certain: irregular or little history</Text>}
    </View>
  );
}
