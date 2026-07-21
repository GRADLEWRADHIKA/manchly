import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Play } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = hp(200);

const heroSlides = [
  {
    id: '1',
    badge: "This Week's Top Pick",
    title: 'Grow with the\nBest Creators',
    subtitle: 'Expert-led learning paths, just for you',
  },
  {
    id: '2',
    badge: 'Trending Now',
    title: 'Master New\nSkills Today',
    subtitle: 'Courses designed by industry experts',
  },
  {
    id: '3',
    badge: 'New Arrivals',
    title: 'Explore Fresh\nContent Daily',
    subtitle: 'Stay ahead with the latest courses',
  },
];

/* ──── Dot Indicator ──── */
const DotIndicator = ({ count, activeIndex }: any) => (
  <View style={styles.dotRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          {
            width: i === activeIndex ? wp(22) : wp(6),
            backgroundColor: i === activeIndex ? colors.secPrimary : '#B8ADA5',
          },
        ]}
      />
    ))}
  </View>
);

/* ──── Hero Carousel ──── */
const HeroCarousel = () => {
  const [activeDotIndex, setActiveDotIndex] = useState(0);

  return (
    <View style={styles.heroSection}>
      <Carousel
        width={SCREEN_WIDTH}
        height={HERO_HEIGHT}
        data={heroSlides}
        loop
        autoPlay
        autoPlayInterval={3000}
        scrollAnimationDuration={900}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.92,
          parallaxScrollingOffset: wp(42),
        }}
        onSnapToItem={setActiveDotIndex}
        renderItem={({ item }) => (
          <ImageBackground
            source={require('../../../../../image/Logo.jpg')}
            style={styles.heroCard}
            imageStyle={styles.heroCardImage}
            resizeMode="cover">
            <View style={styles.heroOverlay} />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{item.badge}</Text>
            </View>
            <Text style={styles.heroTitle}>{item.title}</Text>
            <Text style={styles.heroSub}>{item.subtitle}</Text>
            <View style={styles.resumeBtn}>
              <Play size={wp(14)} color={colors.white} fill={colors.white} />
            </View>
          </ImageBackground>
        )}
      />
      <DotIndicator count={heroSlides.length} activeIndex={activeDotIndex} />
    </View>
  );
};

export default memo(HeroCarousel);

const styles = StyleSheet.create({
  heroSection: {
    paddingTop: hp(20),
  },
  heroCard: {
    flex: 1,
    borderRadius: wp(24),
    padding: wp(22),
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroCardImage: {
    borderRadius: wp(24),
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,15,0.45)',
    borderRadius: wp(24),
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    marginBottom: hp(10),
  },
  heroBadgeText: {
    color: colors.info,
    fontSize: fp(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(26),
    marginBottom: hp(6),
  },
  heroSub: {
    fontSize: fp(12.5),
    color: 'rgba(255,255,255,0.65)',
    lineHeight: fp(18),
    marginBottom: hp(16),
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: wp(8),
    backgroundColor: colors.info,
    paddingHorizontal: wp(18),
    paddingVertical: hp(10),
    borderRadius: wp(12),
  },
  resumeBtnText: {
    color: colors.white,
    fontSize: fp(13.5),
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    marginTop: hp(14),
  },
  dot: {
    height: wp(6),
    borderRadius: wp(4),
  },
});
