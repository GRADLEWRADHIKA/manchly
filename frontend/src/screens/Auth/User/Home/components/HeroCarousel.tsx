import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Play } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = hp(200);

const heroSlides = [
  {
    id: '1',
    badge: 'Start Your Journey',
    title: 'Explore Your Interest',
    subtitle:
      'Unlock your potential with expert advisors and career-focused programs.',
    buttonLabel: 'Browse Courses',
    showPlayIcon: false,
    route: 'ProductsScreen',
    gradient: ['#2563EB', '#1E3A8A', '#0F1B3D'],
    orb1: ['rgba(147,197,253,0.55)', 'rgba(37,99,235,0.03)'],
    orb2: ['rgba(129,140,248,0.45)', 'rgba(79,70,229,0.02)'],
    accent: '#2563EB',
  },
  {
    id: '2',
    badge: 'Continue Learning',
    title: 'Mastering Advanced\nQuant Trading',
    subtitle:
      'Pick up where you left off in Module 4: Sentiment Analysis in High-Frequency Markets.',
    buttonLabel: 'Resume Class',
    showPlayIcon: true,
    route: 'PurchasesScreen',
    gradient: ['#7C3AED', '#5B21B6', '#1E1B4B'],
    orb1: ['rgba(196,181,253,0.55)', 'rgba(124,58,237,0.03)'],
    orb2: ['rgba(244,114,182,0.4)', 'rgba(190,24,93,0.02)'],
    accent: '#7C3AED',
  },
];

/* ──── Animated Gradient Slide ──── */
const HeroSlide = ({ item, onPress }: any) => {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mk = (val: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: dur,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: dur,
            useNativeDriver: true,
          }),
        ]),
      );

    const a = mk(float1, 3200);
    const b = mk(float2, 3800);
    const c = mk(pulse, 2400);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, []);

  const orb1Y = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -hp(20)] });
  const orb1Scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const orb2Y = float2.interpolate({ inputRange: [0, 1], outputRange: [0, hp(16)] });
  const orbOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.75] });

  return (
    <LinearGradient
      colors={item.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      {/* Floating gradient orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { opacity: orbOpacity, transform: [{ translateY: orb1Y }, { scale: orb1Scale }] },
        ]}
      >
        <LinearGradient
          colors={item.orb1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbFill}
        />
      </Animated.View>

      <Animated.View
        style={[styles.orb, styles.orb2, { transform: [{ translateY: orb2Y }] }]}
      >
        <LinearGradient
          colors={item.orb2}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbFill}
        />
      </Animated.View>

      {/* Glossy diagonal sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.6 }}
        style={styles.sheen}
        pointerEvents="none"
      />

      {/* Content */}
      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{item.badge}</Text>
        </View>

        <Text style={styles.heroTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.heroSub} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.resumeBtn}>
          {item.showPlayIcon && (
            <Play size={wp(13)} color={item.accent} fill={item.accent} />
          )}
          <Text style={[styles.resumeBtnText, { color: item.accent }]}>
            {item.buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

/* ──── Hero Carousel ──── */
const HeroCarousel = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.heroSection}>
      <Carousel
        width={SCREEN_WIDTH}
        height={HERO_HEIGHT}
        data={heroSlides}
        loop
        autoPlay
        autoPlayInterval={3500}
        scrollAnimationDuration={900}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.92,
          parallaxScrollingOffset: wp(42),
        }}
        renderItem={({ item }: any) => (
          <HeroSlide
            item={item}
            onPress={() =>
              navigation.navigate('UserBottomTab', { screen: item.route })
            }
          />
        )}
      />
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
  orb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  orb1: {
    width: wp(170),
    height: wp(170),
    borderRadius: wp(85),
    top: -wp(50),
    right: -wp(40),
  },
  orb2: {
    width: wp(120),
    height: wp(120),
    borderRadius: wp(60),
    bottom: -wp(30),
    left: -wp(24),
  },
  orbFill: {
    flex: 1,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: wp(24),
  },
  heroContent: {
    zIndex: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    marginBottom: hp(10),
  },
  heroBadgeText: {
    color: colors.white,
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
    color: 'rgba(255,255,255,0.75)',
    lineHeight: fp(18),
    marginBottom: hp(16),
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: wp(8),
    backgroundColor: colors.white,
    paddingHorizontal: wp(18),
    paddingVertical: hp(10),
    borderRadius: wp(12),
  },
  resumeBtnText: {
    fontSize: fp(13.5),
    fontWeight: '700',
  },
});
