import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Animated } from 'react-native';
import colors from '../../../../../utils/colors';
import { Play } from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';

// ── Animated Progress Bar ─────────────────────────────────────────────────────
const AnimatedProgressBar = ({ progress, color = colors.user.accent }: any) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
};

// ── Main Card ──────────────────────────────────────────────────────────────
const PurchaseCoursCard = ({ item, onPress }: any) => {
  const course = item?.course;
  const title = course?.title || 'Untitled Course';
  const category = course?.category;
  const progress = Math.max(0, Math.min(100, item?.progress || 0));

  const totalLessons = course?.videos?.length || 0;
  // Estimate — no per-lesson completion field exists on the enrollment;
  // this derives a plausible "completed" count from overall progress %.
  const completedLessons = totalLessons
    ? Math.round((progress / 100) * totalLessons)
    : 0;

  const isCompleted = progress >= 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {course?.thumbnail_url ? (
        <Image
          source={{ uri: course.thumbnail_url }}
          style={styles.thumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {!!category && (
          <View style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {category}
            </Text>
          </View>
        )}

        <View style={styles.progressRow}>
          <AnimatedProgressBar progress={progress} />
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.lessonsText}>
            {completedLessons}/{totalLessons} lessons
          </Text>

          <Pressable style={styles.ctaBtn} onPress={onPress} hitSlop={8}>
            {!isCompleted && (
             <Play size={wp(10)} color="#FFFFFF" fill="#FFFFFF" />
            )}
            <Text style={styles.ctaText}>{isCompleted ? 'Review' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

export default PurchaseCoursCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(10),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: colors.user.border,
    gap: wp(10),
  },
  rowPressed: {
    opacity: 0.92,
  },
  thumb: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(10),
  },
  thumbFallback: {
    backgroundColor: colors.user.accentSoft,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: hp(6),
  },
  title: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.user.text,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.user.accentSoft,
    borderRadius: 99,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
  },
  tagText: {
    fontSize: fp(9.5),
    color: colors.greenButtonDark,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  progressTrack: {
    flex: 1,
    height: hp(5),
    backgroundColor: colors.user.cardSoft,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressPercent: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: colors.greenButtonDark,
    minWidth: wp(30),
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  lessonsText: {
    fontSize: fp(11),
    color: colors.user.subHeading,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.greenButtonDark,
    borderRadius: 99,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
  },
  ctaText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});