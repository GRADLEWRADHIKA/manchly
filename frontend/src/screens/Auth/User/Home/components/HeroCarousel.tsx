import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Play } from 'lucide-react-native';
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

const getItemLayout = (_: any, index: number) => ({
  length: HERO_SNAP_WIDTH,
  offset: HERO_SNAP_WIDTH * index,
  index,
});

/* ──── Hero Carousel ──── */
const HeroCarousel = () => {
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const heroCurrentIndex = useRef(INITIAL_INDEX);
  const heroListRef = useRef<FlatList>(null);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrolling = useRef(false);

  const startTimer = useCallback(() => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      if (isUserScrolling.current) return;
      const nextIndex = heroCurrentIndex.current + 1;
      if (nextIndex >= loopedSlides.length) {
        // Reset to middle without animation, then continue
        heroCurrentIndex.current = INITIAL_INDEX;
        heroListRef.current?.scrollToIndex({
          index: INITIAL_INDEX,
          animated: false,
        });
        setActiveDotIndex(INITIAL_INDEX % heroSlides.length);
        return;
      }
      heroCurrentIndex.current = nextIndex;
      setActiveDotIndex(nextIndex % heroSlides.length);
      heroListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    };
  }, [startTimer]);

  const onScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const index = Math.round(
        e.nativeEvent.contentOffset.x / HERO_SNAP_WIDTH,
      );
      heroCurrentIndex.current = index;
      setActiveDotIndex(index % heroSlides.length);
      isUserScrolling.current = false;
      startTimer();
    },
    [startTimer],
  );

  const renderItem = useCallback(({ item }: { item: typeof loopedSlides[0] }) => (
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
  ), []);

  return (
    <View style={styles.heroSection}>
      <FlatList
        ref={heroListRef}
        data={loopedSlides}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={HERO_SNAP_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialScrollIndex={INITIAL_INDEX}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={styles.heroListContent}
        ItemSeparatorComponent={() => <View style={{ width: HERO_CARD_GAP }} />}
        windowSize={3}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
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
  heroListContent: {
    paddingHorizontal: wp(20),
  },
  heroCard: {
    borderRadius: wp(24),
    padding: wp(22),
    minHeight: hp(190),
    justifyContent: 'flex-end',
    width: HERO_CARD_WIDTH,
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