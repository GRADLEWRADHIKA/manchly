import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../utils/colors';

interface Props {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const DashboardCard: React.FC<Props> = ({ icon, value, label }) => {
  return (
    <LinearGradient colors={['#ffffff', '#f4f6f8']} style={styles.card}>
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
    borderRadius: 20,
    paddingVertical: 10,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 6,
  },

  iconWrapper: {
    width: 50,
    height: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  value: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },

  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
