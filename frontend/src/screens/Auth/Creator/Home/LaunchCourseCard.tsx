import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ChevronRight,
  Sparkles,
  Lightbulb,
  PenLine,
  Rocket,
} from 'lucide-react-native';
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
      <LinearGradient
        colors={['#1A1A2E', '#1C1C38', '#241845']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.courseCard}
      >
        <View style={styles.courseHeaderRow}>
          <View style={styles.courseHeaderLeft}>
            <View style={styles.startBadge}>
              <Sparkles size={wp(12)} color={colors.cAccentLight} />
              <Text style={styles.startBadgeText}>START CREATING</Text>
            </View>
            <Text style={styles.courseTitle}>
              Launch Your{' '}
              {creatorStats?.statistics?.courses_sold ? 'Next' : 'First'} Course
            </Text>
            <Text style={styles.courseSubtitle}>
              Turn expertise into income.{'\n'}Ready in under 10 mins.
            </Text>
          </View>
          <Text style={styles.courseEmoji}>📚</Text>
        </View>

        <View style={styles.stepsRow}>
          <View style={styles.stepItem}>
            <View
              style={[styles.stepCircle, { backgroundColor: colors.cAccent }]}
            >
              <Lightbulb size={wp(12)} color={colors.white} />
            </View>
            <Text style={styles.stepTitle}>Pick Topic</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepItem}>
            <View
              style={[styles.stepCircle, { backgroundColor: colors.cAccentLight }]}
            >
              <PenLine size={wp(12)} color={colors.white} />
            </View>
            <Text style={styles.stepTitle}>Add Content</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepItem}>
            <View
              style={[styles.stepCircle, { backgroundColor: colors.accent }]}
            >
              <Rocket size={wp(12)} color={colors.white} />
            </View>
            <Text style={styles.stepTitle}>Publish</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (user?.kyc_verified) {
              navigation.navigate('CreateCourse');
            } else {
              navigation.navigate('KYCVerificationScreen');
            }
          }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>Create Course Now</Text>
          <ChevronRight size={wp(16)} color={colors.cAccent} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

export default memo(LaunchCourseCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  courseCard: {
    borderRadius: wp(16),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(10),
  },
  courseHeaderLeft: {
    flex: 1,
  },
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(4),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(20),
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    marginBottom: hp(6),
  },
  startBadgeText: {
    fontSize: fp(8),
    fontWeight: '800',
    color: colors.cAccentLight,
    letterSpacing: 1,
  },
  courseTitle: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(21),
  },
  courseSubtitle: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(14),
    marginTop: hp(3),
  },
  courseEmoji: {
    fontSize: fp(28),
    marginLeft: wp(8),
    marginTop: hp(4),
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  stepTitle: {
    fontSize: fp(9),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  stepLine: {
    width: wp(30),
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: wp(6),
    marginBottom: hp(12),
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(4),
    backgroundColor: colors.white,
    borderRadius: wp(10),
    paddingVertical: hp(8),
  },
  ctaText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.cAccent,
  },
});
