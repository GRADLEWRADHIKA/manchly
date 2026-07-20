import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ShieldCheck, ChevronRight} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
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
      <View style={styles.row}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <ShieldCheck size={wp(24)} color="#F2E4BC" />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.description}>
            Complete your KYC to unlock higher{'\n'}withdrawal limits and
            premium features.
          </Text>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        onPress={handleVerifyKYC}
        activeOpacity={0.85}>
        <LinearGradient
          colors={['#F3C36B', '#D49A3D']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.button}>
          <Text style={styles.buttonText}>Verify Now</Text>
          <ChevronRight size={wp(16)} color={colors.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: wp(18),
    padding: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(16),
  },
  iconWrap: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(14),
    backgroundColor: 'rgba(214,156,64,0.18)',
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
    color: colors.white,
    marginBottom: hp(4),
  },
  description: {
    fontSize: fp(12.5),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(17),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingVertical: hp(12),
    borderRadius: wp(12),
  },
  buttonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fp(14),
  },
});

export default KycCard;