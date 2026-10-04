import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getEnrolledCourses } from '../../../../../store/EnrollmentSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import ShimmerBox from '../../../../../components/ShimmerBox';

const CardSkeleton = () => (
  <View style={styles.card}>
    <ShimmerBox width={wp(90)} height={hp(14)} radius={20} />
    <ShimmerBox width={wp(160)} height={hp(18)} radius={5} style={{ marginTop: hp(12) }} />
    <ShimmerBox width={wp(200)} height={hp(12)} radius={5} style={{ marginTop: hp(8) }} />
    <ShimmerBox width={'100%'} height={hp(6)} radius={10} style={{ marginTop: hp(16) }} />
    <ShimmerBox width={wp(110)} height={hp(36)} radius={10} style={{ marginTop: hp(16) }} />
  </View>
);

// Picks the most recently-active, not-yet-completed enrollment
const pickInProgress = (list: any[]) => {
  const inProgress = (list || []).filter(
    (e) => e?.completed_at == null && (e?.progress ?? 0) < 100 && e?.course,
  );
  if (inProgress.length === 0) return null;

  return [...inProgress].sort((a, b) => {
    const aTime = new Date(a.last_watched_at || a.enrolled_at).getTime();
    const bTime = new Date(b.last_watched_at || b.enrolled_at).getTime();
    return bTime - aTime;
  })[0];
};

const ContinueLearningCard = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const focus = useIsFocused();
  const { list, loading } = useSelector((state: any) => state.enrollmentsReducer);

  useEffect(() => {
    if (focus) {
      dispatch(getEnrolledCourses({}));
    }
  }, [focus]);

  if (loading && (!list || list.length === 0)) {
    return <CardSkeleton />;
  }

  const current = pickInProgress(list);
  if (!current) {
    return null;
  }

  const progress = Math.max(0, Math.min(100, Math.round(current.progress || 0)));
  const course = current.course;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate('UserVideoList', { item: current })}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Continue Learning</Text>
      </View>

      <View style={styles.chartIconWrap}>
        <TrendingUp size={wp(20)} color={colors.greenButtonDark} strokeWidth={2} />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {course?.title}
      </Text>
      {course?.category ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {course.category}
        </Text>
      ) : null}

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{progress}%</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.resumeBtn, pressed && styles.resumeBtnPressed]}
        onPress={() => navigation.navigate('UserVideoList', { item: current })}
      >
        <Text style={styles.resumeBtnText}>Resume</Text>
      </Pressable>
    </Pressable>
  );
};

export default memo(ContinueLearningCard);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: wp(20),
    marginTop: hp(16),
    backgroundColor: colors.user.border,
    borderRadius: wp(18),
    padding: wp(18),
  },
  cardPressed: {
    opacity: 0.95,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.user.accentSoft,
    borderWidth: 1,
    borderColor: colors.user.accent,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    marginBottom: hp(10),
  },
  badgeText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.greenButtonDark,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chartIconWrap: {
    position: 'absolute',
    top: hp(18),
    right: wp(18),
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: colors.user.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.user.text,
    paddingRight: wp(40),
  },
  subtitle: {
    fontSize: fp(12.5),
    color: colors.user.subHeading,
    marginTop: hp(4),
    paddingRight: wp(40),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginTop: hp(16),
  },
  progressTrack: {
    flex: 1,
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: colors.user.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: hp(3),
    backgroundColor: colors.user.subHeading,
  },
  progressLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.user.accentText,
    minWidth: wp(30),
    textAlign: 'right',
  },
  resumeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.greenButtonDark,
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: wp(10),
    marginTop: hp(16),
  },
  resumeBtnPressed: {
    opacity: 0.85,
  },
  resumeBtnText: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});