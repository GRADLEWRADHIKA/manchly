import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';

const FirstPage = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <ImageBackground
        source={require('../../image/computer.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            {/* Top Badge */}
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>A MUNCH FOR EVERY CREATOR</Text>
              </View>
            </View>

            {/* Hero Section */}
            <View style={styles.heroContainer}>
              {/* Logo + App Name */}
              <View style={styles.logoRow}>
                <Image
                  source={require('../../image/Logo.jpg')}
                  style={styles.logoIcon}
                />
                <Text style={styles.logoName}>Manchly</Text>
              </View>

              <Text style={styles.heroText}>India's #1 Creator App</Text>
              <Text style={styles.subtitleText}>
                Your Creator Studio in Your Pocket
              </Text>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('LoginScreen')}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>

              {/* Trusted by Section */}
              <View style={styles.trustedContainer}>
                <View style={styles.avatarsRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: '#1a2536', zIndex: 4 }]} />
                  <View style={[styles.avatarCircle, { backgroundColor: '#295748', zIndex: 3, marginLeft: -wp(10) }]} />
                  <View style={[styles.avatarCircle, { backgroundColor: '#543143', zIndex: 2, marginLeft: -wp(10) }]} />
                  <View style={[styles.avatarCircle, styles.plusBadge, { zIndex: 1, marginLeft: -wp(10) }]}>
                    <Text style={styles.plusText}>+1M</Text>
                  </View>
                </View>
                <Text style={styles.trustedText}>TRUSTED BY 10,000+ CREATORS</Text>
              </View>

              {/* Made in India + Free & Secure */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>🇮🇳</Text>
                  <Text style={styles.infoText}>Made{'\n'}In India</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>✅</Text>
                  <Text style={styles.infoText}>100%{'\n'}Free & Secure</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

export default FirstPage;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: wp(24),
    paddingVertical: hp(24),
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: hp(12),
  },
  badge: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(6),
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.goldDim,
  },
  badgeText: {
    color: colors.gold,
    fontSize: fp(10),
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(12),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginBottom: hp(16),
  },
  logoIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: 8,
  },
  logoName: {
    color: colors.textPrimary,
    fontSize: fp(24),
    fontWeight: '700',
  },
  heroText: {
    color: colors.textPrimary,
    fontSize: fp(34),
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: colors.textSecondary,
    fontSize: fp(14),
    fontWeight: '400',
    textAlign: 'center',
    marginTop: hp(12),
    lineHeight: fp(20),
  },
  bottomContainer: {
    width: '100%',
    marginBottom: hp(12),
  },
  primaryButton: {
    width: '100%',
    height: hp(54),
    backgroundColor: colors.gold,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(24),
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: fp(16),
    fontWeight: '700',
  },
  trustedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    marginBottom: hp(16),
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  plusBadge: {
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: colors.textPrimary,
    fontSize: fp(7),
    fontWeight: '700',
  },
  trustedText: {
    color: colors.textSecondary,
    fontSize: fp(11),
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(32),
    marginTop: hp(8),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  infoEmoji: {
    fontSize: fp(20),
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fp(11),
    lineHeight: fp(16),
  },
});