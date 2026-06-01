import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  compact?: boolean;
};

const AiButton: React.FC<Props> = ({ label, onPress, loading, style, compact }) => (
  <TouchableOpacity
    style={[compact ? styles.compactBtn : styles.btn, style]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator size="small" color={colors.faaAiPrimary} />
    ) : (
      <>
        <Sparkles size={compact ? wp(12) : wp(14)} color={colors.faaAiPrimary} />
        <Text style={compact ? styles.compactText : styles.text}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

export default AiButton;

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.faaAiPrimary + '15',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: colors.faaAiPrimary + '30',
  },
  text: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.faaAiPrimary,
  },
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.faaAiPrimary + '15',
    paddingHorizontal: wp(8),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  compactText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.faaAiPrimary,
  },
});
