import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ShieldCheck, ChevronRight, AlertCircle} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {wp, hp, fp} from '../../../../utils/responsive';
import colors from '../../../../utils/colors';

const KycCard = () => {
  const navigation = useNavigation<any>();

  const handleVerifyKYC = () => {
    navigation.navigate('KYCVerificationScreen');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleVerifyKYC}
      style={styles.card}>
      {/* Status Badge */}
      <View style={styles.badge}>
        <AlertCircle size={wp(12)} color={colors.golden} />
        <Text style={styles.badgeText}>Action Required</Text>
      </View>

      <View style={styles.row}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <ShieldCheck size={wp(26)} color={colors.accent} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your KYC</Text>
          <Text style={styles.description}>
            Complete KYC to unlock payments & launch products.
          </Text>
        </View>

        {/* Arrow */}
        <View style={styles.arrowWrap}>
          <ChevronRight size={wp(20)} color={colors.textMuted} />
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyKYC}
        activeOpacity={0.85}>
        <Text style={styles.buttonText}>Verify Now</Text>
        <ChevronRight size={wp(16)} color={colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 10,
    elevation: 3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(5),
    backgroundColor: colors.lightGrey,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    marginBottom: hp(12),
  },
  badgeText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.golden,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(14),
  },
  iconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.heading,
    marginBottom: hp(3),
  },
  description: {
    fontSize: fp(12.5),
    color: colors.textSecondary,
    lineHeight: fp(17),
  },
  arrowWrap: {
    marginLeft: wp(8),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: colors.accent,
    paddingVertical: hp(11),
    borderRadius: wp(12),
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(14),
  },
});

export default KycCard;
