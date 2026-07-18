import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const FirstPage = () => {
  const Nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.firstHalf}>
        <Image
          source={require('../../image/boarding.jpg')}
          style={styles.imageMain}
          resizeMode="contain"
        />
      </View>
      <View style={styles.secHalf}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.mainHeader}
          onPress={() => {
            Nav.navigate('NewLoginScreen');
          }}
        >
          <LinearGradient
            colors={['#F3C36B', '#D49A3D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainHeaderGradient}
          >
            <Text style={styles.mainTop}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.trustRow}>
          <View style={styles.avatarStack}>
            <View style={[styles.avatar, { marginLeft: 0 }]} />
            <View style={[styles.avatar, { marginLeft: -wp(10) }]} />
            <View style={[styles.avatarCount, { marginLeft: -wp(10) }]}>
              <Text style={styles.avatarCountText}>+1M</Text>
            </View>
          </View>
          <Text style={styles.trustText}>TRUSTED BY 10,000+ CREATOR</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badgeItem}>
            <Text style={styles.flagEmoji}>🇮🇳</Text>
            <Text style={styles.badgeText}>Made in India</Text>
          </View>
          <View style={styles.badgeItem}>
            <BadgeCheck size={wp(14)} color={colors.info} />
            <Text style={styles.badgeText}>100% Free & Secure</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FirstPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  firstHalf: {
    height: '65%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secHalf: {
    height: '35%',
    paddingHorizontal: wp(20),
  },
  mainHeader: {
    borderRadius: wp(30),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  mainHeaderGradient: {
    paddingVertical: hp(16),
    borderRadius: wp(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTop: {
    fontSize: fp(16),
    color: colors.black,
    fontWeight: '700',
  },
  trustRow: {
    alignItems: 'center',
    marginTop: hp(24),
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  avatar: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.textMuted,
    borderWidth: wp(1.5),
    borderColor: colors.black,
  },
  avatarCount: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.golden,
    borderWidth: wp(1.5),
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCountText: {
    fontSize: fp(8),
    fontWeight: '700',
    color: colors.black,
  },
  trustText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.golden,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(24),
    marginTop: hp(20),
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  badgeText: {
    fontSize: fp(11),
    color: colors.textMuted,
    fontWeight: '500',
  },
  flagEmoji: {
    fontSize: fp(14),
  },
  imageMain: { height: '100%', width: '100%' },
});