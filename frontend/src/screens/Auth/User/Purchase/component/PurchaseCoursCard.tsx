import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../utils/colors';
import {
  CheckCircle2,
  Play,
  Award,
  CircleDot,
  Zap,
  BookOpen,
  Clock,
  RotateCcw,
  Edit3,
} from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';

// ── Animated Progress Bar ─────────────────────────────────────────────────────
const AnimatedProgressBar = ({ progress, color = colors.gold }: any) => {
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

// ── Main Card Component ───────────────────────────────────────────────────────
const PurchaseCoursCard = ({
  item,
  transaction,
  onPress,
  variant = 'ongoing',
  isFeatured = false,
}: any) => {
  const courseTitle = item?.course?.title || 'Untitled Course';
  const progress = item?.progress || 0;
  const modules = item?.course?.modules || [];
  const completedModules = modules.filter((m: any) => m.completed);

  // ── ONGOING VARIANT ─────────────────────────────────────────────────────────
  if (variant === 'ongoing') {
    if (isFeatured) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.ongoingCard, pressed && styles.cardPressed]}
        >
          {/* Course Image */}
          <View style={styles.imageWrap}>
            {item?.course?.thumbnail ? (
              <Image
                source={{ uri: item.course.thumbnail }}
                style={styles.courseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.courseImage, styles.imageFallback]} />
            )}

            {/* Featured Badge */}
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED COURSE</Text>
            </View>
          </View>

          {/* Priority & Total Duration Row */}
          <View style={styles.priorityRow}>
            <View style={styles.priorityLeft}>
              <Zap size={wp(13)} color={colors.user.accentText} fill={colors.user.accentText} />
              <Text style={styles.priorityText}>HIGH PRIORITY</Text>
            </View>
            <Text style={styles.priorityRightText}>
              {item?.total_duration || '—'}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.ongoingTitle}>{courseTitle}</Text>

          {/* Module Checklist */}
          {modules.slice(0, 2).map((mod: any, i: number) => (
            <View key={i} style={styles.moduleRow}>
              {mod.completed ? (
                <CheckCircle2
                  size={wp(15)}
                  color={colors.user.accentText}
                  fill={colors.user.accentText}
                />
              ) : (
                <CircleDot
                  size={wp(15)}
                  color={colors.cAccentLight}
                />
              )}
              <Text style={styles.moduleText} numberOfLines={1}>
                {mod.title || `Module ${i + 1}`}
              </Text>
            </View>
          ))}

          {/* Progress */}
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={{ paddingHorizontal: wp(14), marginBottom: hp(6) }}>
            <AnimatedProgressBar progress={progress} color={colors.cAccentLight} />
          </View>

          {/* Meta Row: Remaining modules and left hours */}
          <View style={styles.ongoingMetaRow}>
            <Text style={styles.ongoingMetaText}>
              {item?.modules_remaining || '8 modules remaining'}
            </Text>
            <Text style={styles.ongoingMetaText}>
              {item?.time_left || '24h left'}
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity style={styles.resumeBtnWrapper} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
             colors={['#86EFAC', '#4ADE80']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resumeBtnGradient}
            >
              <Play size={12} color={colors.user.accentText} fill={colors.user.accentText} />
              <Text style={styles.resumeBtnText}>RESUME LESSON</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      );
    } else {
      // ── Ongoing Variant - Non-Featured ──
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.ongoingCard, pressed && styles.cardPressed]}
        >
          {/* Course Image */}
          <View style={styles.imageWrap}>
            {item?.course?.thumbnail ? (
              <Image
                source={{ uri: item.course.thumbnail }}
                style={styles.nonFeaturedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.nonFeaturedImage, styles.imageFallback]} />
            )}

            {/* Time Left Badge (Top Right) */}
            {item?.time_left && (
              <View style={styles.timeLeftBadge}>
                <Text style={styles.timeLeftBadgeText}>{item.time_left}</Text>
              </View>
            )}
          </View>

          {/* Content Area */}
          <View style={styles.nonFeaturedContent}>
            {/* Title */}
            <Text style={styles.nonFeaturedTitle}>{courseTitle}</Text>

            {/* Next Module/Step Row */}
            {item?.next_step && (
              <View style={styles.nextStepRow}>
                <BookOpen size={wp(13)} color={colors.cTextSecondary} />
                <Text style={styles.nextStepText} numberOfLines={1}>
                  {item.next_step}
                </Text>
              </View>
            )}

            {/* Progress Label Row */}
            <View style={styles.progressLabelRowNonFeatured}>
              <Text style={styles.progressLabel}>
                {item?.lessons_text || `${completedModules.length} lessons completed`}
              </Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={{ paddingHorizontal: wp(14), marginBottom: hp(14) }}>
              <AnimatedProgressBar progress={progress} color={colors.cAccentLight} />
            </View>
          </View>
        </Pressable>
      );
    }
  }

  // ── ARCHIVED VARIANT ────────────────────────────────────────────────────────
  if (variant === 'archived') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.archivedCard, pressed && styles.cardPressed]}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          {item?.course?.thumbnail ? (
            <Image
              source={{ uri: item.course.thumbnail }}
              style={styles.courseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.courseImage, styles.imageFallback]} />
          )}
          <View style={styles.archivedBadge}>
            <Text style={styles.archivedBadgeText}>ARCHIVED</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.archivedTitle}>{courseTitle}</Text>

        {/* Progress Info Row */}
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            Spent {item?.time_spent || '0h'} out of {item?.total_duration || '—'}
          </Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>

        {/* Progress Bar */}
        <View style={{ paddingHorizontal: wp(14), marginBottom: hp(14) }}>
          <AnimatedProgressBar progress={progress} color={colors.cAccentLight} />
        </View>

        {/* Buttons */}
        <View style={styles.archivedBtnRow}>
          <TouchableOpacity style={styles.restoreBtnWrapper} activeOpacity={0.8}>
            <LinearGradient
              colors={['#86EFAC', '#4ADE80']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.restoreBtnGradient}
            >
              <RotateCcw size={14} color={colors.white} />
              <Text style={styles.restoreBtnText}>Restore</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syllabusBtn} activeOpacity={0.8}>
            <Text style={styles.syllabusBtnText}>Syllabus</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  }

  // ── COMPLETED VARIANT ───────────────────────────────────────────────────────
  if (variant === 'completed') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.completedCard, pressed && styles.cardPressed]}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          {item?.course?.thumbnail ? (
            <Image
              source={{ uri: item.course.thumbnail }}
              style={styles.courseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.courseImage, styles.imageFallback]} />
          )}
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>● COURSE COMPLETED</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.completedTitle}>{courseTitle}</Text>
        <Text style={styles.completedDate}>
          Completed on{' '}
          {item?.completed_at
            ? new Date(item.completed_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </Text>

        {/* Duration Row */}
        <View style={styles.completedDurationRow}>
          <Clock size={wp(13)} color={colors.cTextSecondary} />
          <Text style={styles.completedDurationText}>
            {item?.total_duration || '—'} total
          </Text>
        </View>

        {/* Certificate Button */}
        <TouchableOpacity style={styles.certificateBtnWrapper} activeOpacity={0.8}>
          <LinearGradient
            colors={['#86EFAC', '#4ADE80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.certificateBtnGradient}
          >
            <Award size={14} color={colors.user.accentText} />
            <Text style={styles.certificateBtnText}>Download Certificate</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Review Button */}
        <TouchableOpacity style={styles.reviewBtnStacked} onPress={onPress} activeOpacity={0.8}>
          <Edit3 size={14} color={colors.user.accentText} />
          <Text style={styles.reviewBtnStackedText}>Review Course</Text>
        </TouchableOpacity>
      </Pressable>
    );
  }

  return null;
};

export default PurchaseCoursCard;

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },

  // ── Shared ──────────────────────────────────────────────────────────────────
  imageWrap: {
    position: 'relative',
  },
  courseImage: {
    width: '100%',
    height: hp(180),
  },
  imageFallback: {
    backgroundColor: colors.greenButton,
  },
  progressTrack: {
    height: hp(4),
    backgroundColor: colors.user.accent,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },

  // ── Ongoing ─────────────────────────────────────────────────────────────────
  ongoingCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(16),
    marginBottom: hp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.user.card,
  },
  featuredBadge: {
    position: 'absolute',
    bottom: hp(12),
    left: wp(12),
    backgroundColor: colors.user.accent,
    borderWidth: 1,
    borderColor: colors.user.accent,
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  featuredBadgeText: {
    fontSize: fp(9),
    color: colors.user.accentText,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(14),
    marginTop: hp(12),
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  priorityText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.user.accent,
    letterSpacing: 0.5,
  },
  priorityRightText: {
    fontSize: fp(11),
    color: colors.user.accent,
  },
  ongoingTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.user.text,
    padding: wp(14),
    paddingTop: hp(8),
    paddingBottom: hp(12),
    lineHeight: fp(26),
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    paddingHorizontal: wp(14),
    marginBottom: hp(8),
  },
  moduleText: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    flex: 1,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(14),
    marginTop: hp(10),
    marginBottom: hp(6),
  },
  progressLabel: {
    fontSize: fp(11),
    color: colors.user.accent,
  },
  progressPercent: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.user.accent,
  },
  ongoingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(14),
    marginTop: hp(4),
    marginBottom: hp(12),
  },
  ongoingMetaText: {
    fontSize: fp(11),
    color: colors.user.subHeading,
  },
  resumeBtnWrapper: {
    marginHorizontal: wp(14),
    marginBottom: hp(14),
    borderRadius: 8,
    overflow: 'hidden',
  },
  resumeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    paddingVertical: hp(12),
  },
  resumeBtnText: {
    color: colors.user.text,
    fontWeight: '700',
    fontSize: fp(13),
    letterSpacing: 0.5,
  },

  // Non-featured Ongoing Styles
  nonFeaturedImage: {
    width: '100%',
    height: hp(120),
  },
  timeLeftBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    backgroundColor: colors.user.accent,
    borderWidth: 1,
    borderColor: colors.user.accent,
    borderRadius: 99,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
  },
  timeLeftBadgeText: {
    fontSize: fp(9),
    color: colors.user.accentText,
    fontWeight: '600',
  },
  nonFeaturedContent: {
    paddingTop: hp(4),
  },
  nonFeaturedTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.user.accentText,
    paddingHorizontal: wp(14),
    paddingTop: wp(10),
    paddingBottom: hp(4),
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(14),
    marginBottom: hp(8),
  },
  nextStepText: {
    fontSize: fp(12),
    color: colors.user.accentText,
    flex: 1,
  },
  progressLabelRowNonFeatured: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(14),
    marginTop: hp(4),
    marginBottom: hp(6),
  },

  // ── Archived ─────────────────────────────────────────────────────────────────
  archivedCard: {
    backgroundColor: colors.cSurface,
    borderRadius: wp(16),
    marginBottom: hp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  archivedBadge: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    backgroundColor: 'rgba(240, 192, 64, 0.15)',
    borderWidth: 1,
    borderColor: '#F0C040',
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  archivedBadgeText: {
    fontSize: fp(9),
    color: '#F0C040',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  archivedTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.cText,
    padding: wp(14),
    paddingBottom: hp(10),
  },
  archivedBtnRow: {
    flexDirection: 'row',
    gap: wp(10),
    paddingHorizontal: wp(14),
    paddingBottom: hp(14),
  },
  restoreBtnWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  restoreBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingVertical: hp(10),
  },
  restoreBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(13),
  },
  syllabusBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  syllabusBtnText: {
    color: colors.cText,
    fontWeight: '600',
    fontSize: fp(13),
  },

  // ── Completed ────────────────────────────────────────────────────────────────
  completedCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(16),
    marginBottom: hp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.user.card,
  },
  completedBadge: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    backgroundColor: 'rgba(240, 192, 64, 0.15)',
    borderWidth: 1,
    borderColor: '#F0C040',
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  completedBadgeText: {
    fontSize: fp(9),
    color: '#F0C040',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.user.text,
    padding: wp(14),
    paddingBottom: hp(4),
  },
  completedDate: {
    fontSize: fp(12),
    color: colors.user.accentText,
    paddingHorizontal: wp(14),
    marginBottom: hp(4),
  },
  completedDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(14),
    marginBottom: hp(14),
  },
  completedDurationText: {
    fontSize: fp(12),
    color: colors.user.text,
  },
  certificateBtnWrapper: {
    marginHorizontal: wp(14),
    marginBottom: hp(8),
    borderRadius: 8,
    overflow: 'hidden',
  },
  certificateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    paddingVertical: hp(12),
  },
  certificateBtnText: {
    color: colors.user.text,
    fontWeight: '700',
    fontSize: fp(13),
  },
  reviewBtnStacked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: 'transparent',
    marginHorizontal: wp(14),
    marginBottom: hp(14),
    borderRadius: 8,
    paddingVertical: hp(12),
    borderWidth: 1,
    borderColor: colors.user.accent,
  },
  reviewBtnStackedText: {
    color: colors.user.text,
    fontWeight: '700',
    fontSize: fp(13),
  },
});