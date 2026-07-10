import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface Props {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const DashboardCard: React.FC<Props> = ({ icon, value, label }) => {
  return (
    <LinearGradient colors={[colors.gradientStart, colors.surface]} style={styles.card}>
      <View style={styles.iconWrapper}>{icon}</View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </LinearGradient>
  );
};

export default DashboardCard;

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: wp(20),
    paddingVertical: hp(10),
    marginBottom: hp(16),
    alignItems: 'center',
    elevation: 6,
  },

  iconWrapper: {
    width: wp(50),
    height: hp(50),
    backgroundColor: colors.golden,
    justifyContent: 'center',
    alignItems: 'center',
  },

  value: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.text,
  },

  label: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(4),
  },
});
