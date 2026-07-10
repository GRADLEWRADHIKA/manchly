import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface LineChartProps {
  data: number[];
  labels: string[];
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({
  data = [10, 45, 20, 65, 30, 85, 40],
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  height = hp(80),
}) => {
  const [width, setWidth] = useState(300);

  // Calculations for scale
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - 20) + 10;
    // Map value to Y (SVG Y goes down, so we subtract from height)
    // Keep 10px padding top/bottom
    const chartHeight = height - 20;
    const y = height - 10 - ((val - minVal) / range) * chartHeight;
    return { x, y };
  });

  // Construct SVG Path (smooth quadratic bezier curve)
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      pathD += ` Q ${cpX} ${curr.y}, ${next.x} ${next.y}`;
    }
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width: layoutWidth } = e.nativeEvent.layout;
        if (layoutWidth) setWidth(layoutWidth);
      }}
    >
      <View style={{ height }}>
        {width > 0 && points.length > 0 && (
          <Svg height={height} width={width}>
            <Path
              d={pathD}
              fill="none"
              stroke={colors.gold || '#F0C040'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </Svg>
        )}
      </View>
      <View style={styles.labelsRow}>
        {labels.map((label, index) => (
          <Text key={index} style={styles.labelText}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default LineChart;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: hp(12),
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(10),
    marginTop: hp(8),
  },
  labelText: {
    fontSize: fp(10),
    color: colors.textMuted || '#555558',
    fontWeight: '500',
  },
});
