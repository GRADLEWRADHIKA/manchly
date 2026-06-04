import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const LaunchCourseCard = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);

  return (
    <View style={styles.sectionPadding}>
      <Text style={styles.sectionTitle}>Start creating</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (user?.kyc_verified) {
            navigation.navigate('CreateCourse');
          } else {
            navigation.navigate('KYCVerificationScreen');
          }
        }}
      >
        <LinearGradient
          colors={['#1E2038', '#222448', '#2A2455']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.courseCard}
        >
          <View style={styles.topRow}>
            <View style={styles.iconWrap}>
              <BookOpen size={wp(20)} color="#60A5FA" />
            </View>
            <View style={styles.createBadge}>
              <Sparkles size={wp(10)} color={colors.cAccentLight} />
              <Text style={styles.createBadgeText}>CREATE</Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>
            Launch Your{' '}
            {creatorStats?.statistics?.courses_sold ? 'Next' : ''} Course
          </Text>
          <Text style={styles.courseSubtitle}>
            Turn expertise into income. Ready in under 10 mins.
          </Text>

          <View style={styles.bottomRow}>
            <Text style={styles.ctaText}>Get Started</Text>
            <View style={styles.arrowCircle}>
              <ArrowRight size={wp(18)} color="#0A1628" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default memo(LaunchCourseCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(20),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.cText,
    marginBottom: hp(12),
  },
  courseCard: {
    borderRadius: wp(16),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  iconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(12),
    backgroundColor: 'rgba(96,165,250,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(139,92,246,0.2)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  createBadgeText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: colors.cAccentLight,
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(4),
  },
  courseSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: fp(18),
    marginBottom: hp(12),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: wp(12),
    paddingVertical: hp(8),
    paddingHorizontal: wp(14),
  },
  ctaText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
  arrowCircle: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
