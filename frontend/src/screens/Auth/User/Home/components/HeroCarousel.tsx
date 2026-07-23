import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Play, Route } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import UserView from '../../Products/UserView';
import PurchasesScreen from '../../Purchase/PurchasesScreen';
import { useNavigation } from '@react-navigation/native';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = hp(200);

const heroSlides = [
  {
    id: '1',
    badge: 'Start Your Journey',
    title: 'Explore Your Interest',
    subtitle:
      'Unlock Your Potential with expert\nadvisors and career-focused\nprograms',
    buttonLabel: 'Browse Courses',
    showPlayIcon: false,
    route: 'UserView',
  },
  {
    id: '2',
    badge: 'Continue Learning',
    title: 'Mastering Advanced Quant Trading Strategies',
    subtitle:
      'Pick up where you left off in Module 4: Sentiment Analysis in High-Frequency Markets.',
    buttonLabel: 'Resume Class',
    showPlayIcon: true,
    route: 'PurchasesScreen',
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
            backgroundColor: i === activeIndex ? colors.uBg : '#B8ADA5',
          },
        ]}
      />
    ))}
  </View>
);

/* ──── Hero Carousel ──── */
const HeroCarousel = () => {
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const navigation = useNavigation<any>();

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
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />

            <LinearGradient
              colors={[colors.btnGradientStart, colors.btnGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBadge}
            >
              <Text style={styles.heroBadgeText}>{item.badge}</Text>
            </LinearGradient>

            <Text style={styles.heroTitle}>{item.title}</Text>
            <Text style={styles.heroSub}>{item.subtitle}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate(item.route)}
            >
              <LinearGradient
                colors={[colors.btnGradientStart, colors.btnGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resumeBtn}
              >
                {item.showPlayIcon && (
                  <Play size={wp(14)} color={colors.white} fill={colors.white} />
                )}
                <Text style={styles.resumeBtnText}>{item.buttonLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    //backgroundColor: 'rgba(59,130,246,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.5)',
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
    //backgroundColor: colors.info,
    paddingHorizontal: wp(18),
    paddingVertical: hp(10),
    borderRadius: wp(12),
  },
  resumeBtnText: {
    color: colors.textPrimary,
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
