import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const SessionCard = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { expertProfile } = useSelector(
    (state: any) => state.sessionReducer,
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.cardWrapper}
      onPress={() => {
        if (!user?.kyc_verified) {
          navigation.navigate('KYCVerificationScreen');
        } else if (expertProfile) {
          navigation.navigate('CreatorBottomTab', {
            screen: 'ProductsScreen',
            params: { initialTab: 'Sessions' },
          });
        } else {
          navigation.navigate('ExpertRegistration');
        }
      }}
    >
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <Phone size={wp(18)} color="#60A5FA" />
        </View>

        <Text style={styles.title}>1:1 Sessions</Text>
        <Text style={styles.subtitle}>
          Monetize your expertise with paid video calls.
        </Text>

        <Text style={styles.ctaText}>Start →</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default memo(SessionCard);

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: wp(16),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  iconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: 'rgba(96,165,250,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  title: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(4),
  },
  subtitle: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    lineHeight: fp(16),
    marginBottom: hp(10),
  },
  ctaText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
});
