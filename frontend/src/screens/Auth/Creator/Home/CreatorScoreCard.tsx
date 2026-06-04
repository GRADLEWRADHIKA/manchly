import React, { memo, useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Circle, Star } from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { fetchCourses, getCreatorCourseStats } from '../../../../store/CourseSlice';
import { getAllWebinar, getCreatorWebinarStats } from '../../../../store/WebinarSlice';

const CreatorScoreCard = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const focus = useIsFocused();
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector(
    (state: any) => state.webinarReducer,
  );
  const [courses, setCourses] = useState<any[]>([]);
  const [webiniarData, setWebinarData] = useState<any[]>([]);

  useEffect(() => {
    const payload = { page: 1, limit: 10, my_courses: true };
    dispatch(fetchCourses(payload))
      .unwrap()
      .then((response: any) => {
        setCourses(response?.data?.data?.courses || []);
      });

    const webinarPayload = {
      page: 1,
      limit: 50,
      upcoming: true,
      title: '',
      my_webinars: true,
    };
    dispatch(getAllWebinar(webinarPayload))
      .unwrap()
      .then((response: any) => {
        setWebinarData(response?.data?.data?.webinars || []);
      });
  }, [focus]);

  const milestones = useMemo(
    () => [
      { label: 'Create your account', pts: 10, completed: true },
      { label: 'Complete your profile', pts: 2, completed: true },
      {
        label: 'Publish your first course',
        pts: 30,
        completed: courses.length > 0,
      },
      {
        label: 'Go Live once',
        pts: 20,
        completed: webiniarData.length > 0,
      },
      {
        label: 'Get your first student',
        pts: 40,
        completed: !!creatorStats?.statistics?.total_enrollments,
      },
    ],
    [creatorStats, creatorWebinarStats, courses.length, webiniarData.length],
  );

  const totalPts = milestones.reduce((sum, m) => sum + m.pts, 0);
  const earnedPts = milestones.reduce(
    (sum, m) => sum + (m.completed ? m.pts : 0),
    0,
  );
  const progressPercent = Math.round((earnedPts / totalPts) * 100);
  const circumference = 2 * Math.PI * wp(28);
  const progressOffset = circumference * (1 - progressPercent / 100);
  const allCompleted = milestones.every(m => m.completed);

  return (
    <View style={styles.sectionPadding}>
      {allCompleted ? (
        <LinearGradient
          colors={[colors.cCard, '#1A1A3E', colors.cAccent + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreCard}
        >
          <View style={styles.trophyWrap}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>
          <Text style={styles.proTitle}>You're a Manchly Pro!</Text>
          <Text style={styles.proDescription}>
            All starter tasks done. You've earned{' '}
            <Text style={styles.proPointsHighlight}>{earnedPts} pts</Text> and
            {'\n'}unlocked the{' '}
            <Text style={styles.proBadgeHighlight}>Rising Star </Text>
            <Star
              size={wp(14)}
              color={colors.golden}
              fill={colors.golden}
            />{' '}
            badge.
          </Text>
          <View style={styles.taskIconsRow}>
            {['🎓', '📡', '💰', '👥', '✅'].map((emoji, index) => (
              <View key={index} style={styles.taskIconBox}>
                <Text style={styles.taskIconEmoji}>{emoji}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CreateProducts')}
            style={styles.keepGrowingBtn}
          >
            <Text style={styles.keepGrowingText}>
              🚀 Keep Growing on Manchly →
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[colors.cCard, '#1A1A3E', colors.cAccent + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreCard}
        >
          <View style={styles.scoreTopRow}>
            <View>
              <Text style={styles.scoreLabel}>CREATOR SCORE</Text>
              <Text style={styles.scoreValue}>{earnedPts}</Text>
            </View>
            <View style={styles.progressRingWrap}>
              <Svg width={wp(70)} height={wp(70)}>
                <SvgCircle
                  cx={wp(35)}
                  cy={wp(35)}
                  r={wp(28)}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={wp(5)}
                  fill="none"
                />
                <SvgCircle
                  cx={wp(35)}
                  cy={wp(35)}
                  r={wp(28)}
                  stroke="#9B59B6"
                  strokeWidth={wp(5)}
                  fill="none"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${progressOffset}`}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${wp(35)}, ${wp(35)}`}
                />
              </Svg>
              <View style={styles.progressRingText}>
                <Text style={styles.progressPercent}>
                  {progressPercent}%
                </Text>
                <Text style={styles.progressDone}>done</Text>
              </View>
            </View>
          </View>
          <View style={styles.nextLevelRow}>
            <Text style={styles.nextLevelText}>Next: </Text>
            <Text style={styles.nextLevelName}>Rising Star </Text>
            <Star
              size={wp(16)}
              color={colors.golden}
              fill={colors.golden}
            />
          </View>
          <View style={styles.milestonesWrap}>
            {milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneCheck,
                    milestone.completed && styles.milestoneCompleted,
                  ]}
                >
                  {milestone.completed ? (
                    <Check
                      size={wp(14)}
                      color={colors.white}
                      strokeWidth={3}
                    />
                  ) : (
                    <Circle size={wp(14)} color="rgba(255,255,255,0.3)" />
                  )}
                </View>
                <Text
                  style={[
                    styles.milestoneText,
                    milestone.completed && styles.milestoneTextCompleted,
                  ]}
                >
                  {milestone.label}
                </Text>
                <View style={styles.milestonePts}>
                  <Text style={styles.milestonePtsText}>
                    +{milestone.pts} pts
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      )}
    </View>
  );
};

export default memo(CreatorScoreCard);

const styles = StyleSheet.create({
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  scoreCard: {
    borderRadius: wp(20),
    padding: wp(20),
    shadowColor: '#1E2038',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  scoreLabel: {
    fontSize: fp(16),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    marginBottom: hp(4),
  },
  scoreValue: {
    fontSize: fp(48),
    fontWeight: '800',
    color: '#9B59B6',
  },
  progressRingWrap: {
    width: wp(70),
    height: wp(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
  progressDone: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  nextLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  nextLevelText: {
    fontSize: fp(15),
    color: colors.white,
    fontWeight: '500',
  },
  nextLevelName: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.cAccentLight,
  },
  milestonesWrap: {
    gap: hp(10),
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: wp(14),
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
  },
  milestoneCheck: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  milestoneCompleted: {
    backgroundColor: colors.accent,
  },
  milestoneText: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white,
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.5)',
  },
  milestonePts: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp(12),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  milestonePtsText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.golden,
  },
  trophyWrap: {
    alignItems: 'center',
    marginBottom: hp(16),
    marginTop: hp(8),
  },
  trophyEmoji: {
    fontSize: fp(64),
  },
  proTitle: {
    fontSize: fp(26),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(12),
  },
  proDescription: {
    fontSize: fp(15),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: fp(22),
    marginBottom: hp(20),
  },
  proPointsHighlight: {
    fontWeight: '800',
    color: colors.golden,
  },
  proBadgeHighlight: {
    fontWeight: '800',
    color: colors.cAccentLight,
  },
  taskIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(12),
    marginBottom: hp(22),
  },
  taskIconBox: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconEmoji: {
    fontSize: fp(24),
  },
  keepGrowingBtn: {
    backgroundColor: '#2ECC71',
    borderRadius: wp(16),
    paddingVertical: hp(16),
    alignItems: 'center',
  },
  keepGrowingText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.cText,
  },
});
