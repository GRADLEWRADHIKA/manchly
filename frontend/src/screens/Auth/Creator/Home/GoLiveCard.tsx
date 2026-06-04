import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Satellite } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const GoLiveCard = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.cardWrapper}
      onPress={() => {
        if (user?.kyc_verified) {
          navigation.navigate('CreateWebinar');
        } else {
          navigation.navigate('KYCVerificationScreen');
        }
      }}
    >
      <LinearGradient
        colors={['#1E2038', '#222448', '#2A2455']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Satellite size={wp(18)} color="#60A5FA" />
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.title}>Go Live</Text>
        <Text style={styles.subtitle}>
          Connect with your audience in real time.
        </Text>

        <Text style={styles.ctaText}>Start →</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default memo(GoLiveCard);

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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(10),
  },
  iconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: 'rgba(96,165,250,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(10),
  },
  greenDot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.accent,
  },
  liveBadgeText: {
    fontSize: fp(9),
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5,
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
    color: colors.cAccentLight,
  },
});
