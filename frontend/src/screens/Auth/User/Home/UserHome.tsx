import React, { memo } from 'react';
import { View, ScrollView, StyleSheet,  } from 'react-native';
import { useNavigation } from '@react-navigation/native';
//import { ChevronRight, Store } from 'lucide-react-native';
import { hp, wp, fp } from '../../../../utils/responsive';
import colors from '../../../../utils/colors';
import HomeHeader from './components/HomeHeader';
import HeroCarousel from './components/HeroCarousel';
import LatestCourses from './components/LatestCourses';
import LatestWebinars from './components/LatestWebinars';
import TopExperts from './components/TopExperts';
//import BrandMarketplace from '../Marketplace/BrandMarketplace';
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
        
        <TopExperts />
        <LatestCourses />
        <LatestWebinars />

      {/*
<TouchableOpacity
  style={styles.marketPlaceBanner}
  activeOpacity={0.8}
  onPress={() => navigation.navigate('BrandMarketplace')}
>
  <View style={styles.marketPlaceIcon}>
    <Store size={wp(20)} color={colors.textPrimary} />
  </View>
  <View style={styles.marketPlaceContent}>
    <Text style={styles.marketPlaceTitle}>Market Place</Text>
  </View>
  <View style={styles.marketPlaceAction}>
    <Text style={styles.marketPlaceActionText}>Go to Hub</Text>
    <ChevronRight size={wp(16)} color={colors.textPrimary} />
  </View>
</TouchableOpacity>
*/}
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
    backgroundColor:colors.user.subHeading,
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