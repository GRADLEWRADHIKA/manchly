import React, { memo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { hp, wp, fp } from '../../../../utils/responsive';
import colors from '../../../../utils/colors';
import HomeHeader from './components/HomeHeader';
import LatestCourses from './components/LatestCourses';
import LatestWebinars from './components/LatestWebinars';
import PopularSession from './components/PopularSession';
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
        <TouchableOpacity activeOpacity={0.9} style={styles.bannerWrapper}>
          <View style={styles.bannerTextBox}>
            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>Explore & Learn</Text>
            </View>
            <Text style={styles.bannerTitle}>Learn from real creators.</Text>
            <Text style={styles.bannerSub} numberOfLines={3}>
              Discover courses, live webinars and 1:1 sessions to build new
              skills.
            </Text>
          </View>
          <Image
            source={require('../../../../image/human.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <LatestCourses />
        <LatestWebinars />
        <PopularSession />
      </ScrollView>
    </View>
  );
};

export default memo(UserHome);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.user.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.user.bg,
  },
  scrollContent: {
    paddingBottom: hp(100),
  },
  bannerWrapper: {
    flexDirection: 'row',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(14),
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#E8F8EE',
  },
  bannerImage: {
    width: '50%',
    height: hp(150),
  },
  bannerTextBox: {
    flex: 1,
    paddingHorizontal: wp(14),
    paddingVertical: hp(12),
  },
  bannerPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#C9F2D8',
    borderRadius: wp(20),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    marginBottom: hp(8),
  },
  bannerPillText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#15803D',
  },
  bannerTitle: {
    fontSize: fp(15),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: hp(4),
  },
  bannerSub: {
    fontSize: fp(11),
    color: '#64748B',
    lineHeight: fp(15),
  },
  expertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(16),
    marginBottom: hp(8),
    backgroundColor: colors.user.text,
    borderRadius: wp(14),
    padding: wp(14),
  },
  expertBannerIcon: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: colors.user.subHeading,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertBannerContent: {
    flex: 1,
    marginLeft: wp(12),
  },
  expertBannerTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.user.text,
  },
  expertBannerSub: {
    fontSize: fp(11),
    color: colors.user.accentText,
    marginTop: hp(2),
  },
  marketPlaceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(12),
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  marketPlaceIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(10),
    backgroundColor: colors.uBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketPlaceContent: {
    flex: 1,
    marginLeft: wp(12),
  },
  marketPlaceTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  marketPlaceAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketPlaceActionText: {
    fontSize: fp(12),
    color: colors.textPrimary,
    marginRight: wp(2),
  },
});
