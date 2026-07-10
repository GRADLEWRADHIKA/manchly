import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

interface FormFieldProps extends TextInputProps {
  label: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted || '#555558'}
        {...props}
      />
    </View>
  );
};

export const formatINR = (amount: number | string): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0.00';

  const parts = num.toFixed(2).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherParts = parts[0].substring(0, parts[0].length - 3);
  if (otherParts !== '') {
    lastThree = ',' + lastThree;
  }
  const res = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + '.' + parts[1];
  return `₹${res}`;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(16),
  },
  label: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.textMuted || '#555558',
    marginBottom: hp(6),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.inputBg || '#242426',
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    borderRadius: 10,
    height: hp(44),
    paddingHorizontal: wp(14),
    fontSize: fp(14),
    color: colors.white || '#FFFFFF',
  },
});
