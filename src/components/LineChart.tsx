import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, type } from '@/theme/theme';

export interface ChartPoint {
  x: number; // index
  y: number; // value
  label?: string;
}

// A small, dependency-free SVG line chart. Deliberately simple: this app's
// "signature" numeric treatment does the visual heavy lifting, so the chart
// itself stays quiet and legible rather than decorative.
export function LineChart({
  points,
  height = 160,
  width = 320,
  formatValue,
}: {
  points: ChartPoint[];
  height?: number;
  width?: number;
  formatValue?: (v: number) => string;
}) {
  if (points.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={type.bodySecondary}>Not enough data yet</Text>
      </View>
    );
  }

  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 24;
  const paddingBottom = 24;

  const values = points.map((p) => p.y);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yRange = maxY - minY || 1;

  const plotW = width - paddingLeft - paddingRight;
  const plotH = height - paddingTop - paddingBottom;

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW + paddingLeft;
    const y = paddingTop + plotH - ((p.y - minY) / yRange) * plotH;
    return { x, y, value: p.y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const last = coords[coords.length - 1];
  const first = points[0];
  const lastPoint = points[points.length - 1];

  return (
    <View>
      <Svg width={width} height={height}>
        {/* baseline grid */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + plotH}
          x2={width - paddingRight}
          y2={paddingTop + plotH}
          stroke={colors.chartGrid}
          strokeWidth={1}
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.chartLine}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <Circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 4 : 2.5}
            fill={i === coords.length - 1 ? colors.accent : colors.textFaint}
          />
        ))}
        {/* max label */}
        <SvgText
          x={last.x}
          y={last.y - 10}
          fill={colors.textPrimary}
          fontSize={12}
          fontFamily={type.statMedium.fontFamily}
          fontWeight="700"
          textAnchor="end"
        >
          {formatValue ? formatValue(lastPoint.y) : String(lastPoint.y)}
        </SvgText>
      </Svg>
    </View>
  );
}
