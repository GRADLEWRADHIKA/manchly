import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_CARD_GAP = wp(12);
const HERO_CARD_WIDTH = SCREEN_WIDTH - wp(40);
const HERO_SNAP_WIDTH = HERO_CARD_WIDTH + HERO_CARD_GAP;

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

const LOOP_COUNT = 100;
const loopedSlides = Array.from({ length: LOOP_COUNT * heroSlides.length }, (_, i) => ({
  ...heroSlides[i % heroSlides.length],
  key: String(i),
}));
const INITIAL_INDEX = Math.floor(LOOP_COUNT / 2) * heroSlides.length;

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
  const heroCurrentIndex = useRef(INITIAL_INDEX);
  const heroScrollRef = useRef<ScrollView>(null);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onHeroLayout = useCallback(() => {
    heroScrollRef.current?.scrollTo({
      x: INITIAL_INDEX * HERO_SNAP_WIDTH,
      animated: false,
    });
  }, []);

  useEffect(() => {
    heroTimerRef.current = setInterval(() => {
      heroCurrentIndex.current += 1;
      setActiveDotIndex(heroCurrentIndex.current % heroSlides.length);
      heroScrollRef.current?.scrollTo({
        x: heroCurrentIndex.current * HERO_SNAP_WIDTH,
        animated: true,
      });
    }, 3000);
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    };
  }, []);

  const onHeroScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        e.nativeEvent.contentOffset.x / HERO_SNAP_WIDTH,
      );
      heroCurrentIndex.current = index;
      setActiveDotIndex(index % heroSlides.length);
    },
    [],
  );

  return (
    <View style={styles.heroSection}>
      <ScrollView
        ref={heroScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={HERO_SNAP_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onLayout={onHeroLayout}
        onMomentumScrollEnd={onHeroScrollEnd}
        contentContainerStyle={styles.heroListContent}>
        {loopedSlides.map((item, index) => (
          <LinearGradient
            key={item.key}
            colors={['#3D1515', '#7A2020', '#B54040']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              index < loopedSlides.length - 1 && { marginRight: HERO_CARD_GAP },
            ]}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{item.badge}</Text>
            </View>
            <Text style={styles.heroTitle}>{item.title}</Text>
            <Text style={styles.heroSub}>{item.subtitle}</Text>
          </LinearGradient>
        ))}
      </ScrollView>
      <DotIndicator count={heroSlides.length} activeIndex={activeDotIndex} />
    </View>
  );
};

export default memo(HeroCarousel);

const styles = StyleSheet.create({
  heroSection: {
    paddingTop: hp(20),
  },
  heroListContent: {
    paddingHorizontal: wp(20),
  },
  heroCard: {
    borderRadius: wp(24),
    padding: wp(22),
    minHeight: hp(160),
    justifyContent: 'flex-end',
    width: HERO_CARD_WIDTH,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,140,0.3)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    marginBottom: hp(10),
  },
  heroBadgeText: {
    color: '#FFD6A5',
    fontSize: fp(10),
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: fp(24),
    fontWeight: '900',
    color: colors.white,
    lineHeight: fp(30),
    marginBottom: hp(6),
  },
  heroSub: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.7)',
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
