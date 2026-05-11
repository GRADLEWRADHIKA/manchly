import React, { memo } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Stars } from 'lucide-react-native';
import { hp, wp, fp } from '../../../../utils/responsive';
import colors from '../../../../utils/colors';
import HomeHeader from './components/HomeHeader';
import HeroCarousel from './components/HeroCarousel';
import LatestCourses from './components/LatestCourses';
import LatestWebinars from './components/LatestWebinars';

const UserHome = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      <HomeHeader />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroCarousel />

        {/* Astrologer Banner */}
        <TouchableOpacity
          style={styles.astroBanner}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AstrologerList')}
        >
          <View style={styles.astroBannerIcon}>
            <Stars size={wp(28)} color={colors.white} strokeWidth={1.8} />
          </View>
          <View style={styles.astroBannerContent}>
            <Text style={styles.astroBannerTitle}>Talk to Astrologers</Text>
            <Text style={styles.astroBannerSub}>
              Get guidance from expert astrologers via call, video or chat
            </Text>
          </View>
          <Text style={styles.astroBannerArrow}>›</Text>
        </TouchableOpacity>

        <LatestCourses />
        <LatestWebinars />
      </ScrollView>
    </View>
  );
};

export default memo(UserHome);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(100),
  },
  astroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    marginBottom: hp(8),
    backgroundColor: colors.secPrimary,
    borderRadius: wp(14),
    padding: wp(14),
  },
  astroBannerIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  astroBannerContent: {
    flex: 1,
    marginLeft: wp(12),
  },
  astroBannerTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  astroBannerSub: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.8)',
    marginTop: hp(2),
  },
  astroBannerArrow: {
    fontSize: fp(24),
    color: colors.white,
    fontWeight: '300',
    marginLeft: wp(4),
  },
});
