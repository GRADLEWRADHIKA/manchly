import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import React, { useState } from 'react';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { MoveRight } from 'lucide-react-native';
import TermsModal from '../../../components/TermsModal';
import PrivacyModal from '../../../components/PrivacyModal';
import RefundPolicyModal from '../../../components/RefundPolicyModal';
import LinearGradient from 'react-native-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChooseType = ({ setSelectedType, setActive }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Top Half - Image */}
      <View style={styles.topHalf}>
        <Image
          source={require('../../../image/boarding.jpg')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Welcome</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cardShadow}
          onPress={() => {
            setSelectedType('CREATOR');
            setActive(2);
          }}
        >
          <LinearGradient
            colors={['#F3C36B', '#D49A3D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardInner}
          >
            <View>
              <Text style={styles.subtitle}>creator</Text>
              <Text style={styles.description}>Create & publish content</Text>
            </View>
            <MoveRight size={wp(22)} color={colors.black} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cardShadow}
          onPress={() => {
            setSelectedType('USER');
            setActive(2);
          }}
        >
          <LinearGradient
            colors={['#F3C36B', '#D49A3D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardInner}
          >
            <View>
              <Text style={styles.subtitle}>user</Text>
              <Text style={styles.description}>Browse & consume content</Text>
            </View>
            <MoveRight size={wp(22)} color={colors.black} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.linkText}
            onPress={() => setShowTerms(true)}
          >
            Terms of Service
          </Text>
          ,{' '}
          <Text
            style={styles.linkText}
            onPress={() => setShowPrivacy(true)}
          >
            Privacy Policy
          </Text>
          {' & '}
          <Text
            style={styles.linkText}
            onPress={() => setShowRefund(true)}
          >
            Refund Policy
          </Text>
        </Text>
      </View>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <RefundPolicyModal visible={showRefund} onClose={() => setShowRefund(false)} />
    </View>
  );
};

export default ChooseType;

const styles = StyleSheet.create({
  wrapper: {
    height: SCREEN_HEIGHT,
    backgroundColor: colors.primary,
  },

  topHalf: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  bottomSheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: wp(28),
    borderTopRightRadius: wp(28),
    paddingHorizontal: wp(24),
    paddingTop: hp(32),
    paddingBottom: hp(30),
  },

  title: {
    fontSize: fp(28),
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(28),
    letterSpacing: 0.2,
  },

  cardShadow: {
    marginTop: hp(14),
    borderRadius: wp(18),
    shadowColor: colors.golden,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  cardInner: {
    paddingVertical: hp(18),
    paddingHorizontal: wp(20),
    borderRadius: wp(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitle: {
    fontSize: fp(16.5),
    fontWeight: '700',
    color: colors.black,
    marginBottom: hp(2),
    textTransform: 'capitalize',
  },

  description: {
    fontSize: fp(12),
    fontWeight: '500',
    color: 'rgba(0,0,0,0.65)',
  },

  termsText: {
    fontSize: fp(11),
    fontWeight: '500',
    color: 'rgba(240,192,64,0.6)',
    textAlign: 'center',
    lineHeight: fp(17),
    marginTop: hp(20),
    marginBottom: hp(8),
  },

  linkText: {
    color: '#F0C040',
    fontWeight: '700',
  },
});