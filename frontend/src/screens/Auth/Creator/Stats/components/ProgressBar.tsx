import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface ProgressBarProps {
  label: string;
  progress: number; // Percentage value (0 to 100)
  style?: StyleProp<ViewStyle>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, progress, style }) => {
  // Ensure progress is bound between 0 and 100
  const boundedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={[styles.container, style]}>
      {/* Label (Left) */}
      <Text style={styles.labelText}>{label}</Text>

      {/* Progress Track & Fill */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${boundedProgress}%` }]} />
      </View>

      {/* Percentage (Right) */}
      <Text style={styles.percentageText}>{boundedProgress}%</Text>
    </View>
  );
};

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(6),
  },
  labelText: {
    width: wp(50),
    fontSize: fp(12),
    color: colors.textSecondary || '#888888',
    fontWeight: '500',
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border || '#2A2A2C',
    borderRadius: 99,
    marginHorizontal: wp(12),
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold || '#F0C040',
    borderRadius: 99,
  },
  percentageText: {
    width: wp(35),
    textAlign: 'right',
    fontSize: fp(12),
    color: colors.white || '#FFFFFF',
    fontWeight: '600',
  },
});
