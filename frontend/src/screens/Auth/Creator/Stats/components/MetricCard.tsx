import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface MetricCardProps {
  label: string;
  value: string;
  subLabel?: string;
  changeText?: string;
  changeType?: 'up' | 'down' | 'none';
  style?: StyleProp<ViewStyle>;
  valueSize?: 'large' | 'medium';
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subLabel,
  changeText,
  changeType = 'none',
  style,
  valueSize = 'medium',
}) => {
  const showBadge = changeText && changeType !== 'none';
  const isUp = changeType === 'up';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showBadge && (
          <View style={[styles.badge, isUp ? styles.badgeUp : styles.badgeDown]}>
            {isUp ? (
              <ArrowUpRight size={10} color="#22C55E" style={styles.badgeIcon} />
            ) : (
              <ArrowDownRight size={10} color="#EF4444" style={styles.badgeIcon} />
            )}
            <Text style={[styles.badgeText, isUp ? styles.badgeTextUp : styles.badgeTextDown]}>
              {changeText}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, valueSize === 'large' ? styles.valueLarge : styles.valueMedium]}>
        {value}
      </Text>

      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
};

export default MetricCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  label: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.textMuted || '#555558',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
  },
  valueLarge: {
    fontSize: fp(28),
  },
  valueMedium: {
    fontSize: fp(20),
  },
  subLabel: {
    fontSize: fp(11),
    color: colors.textSecondary || '#888888',
    marginTop: hp(4),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: 6,
  },
  badgeUp: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  badgeDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  badgeIcon: {
    marginRight: wp(2),
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextUp: {
    color: '#22C55E',
  },
  badgeTextDown: {
    color: '#EF4444',
  },
});
