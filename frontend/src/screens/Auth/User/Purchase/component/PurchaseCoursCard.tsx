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
import colors from '../../../../../utils/colors';
import {
  CheckCircle2,
  Play,
  Award,
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
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>✦ FEATURED COURSE</Text>
            </View>
          )}

          {/* Priority Badge */}
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityBadgeText}>⬆ HIGH PRIORITY</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.ongoingTitle}>{courseTitle}</Text>

        {/* Module Checklist */}
        {modules.slice(0, 2).map((mod: any, i: number) => (
          <View key={i} style={styles.moduleRow}>
            <CheckCircle2
              size={wp(14)}
              color={mod.completed ? '#22C55E' : colors.textMuted}
              fill={mod.completed ? '#22C55E' : 'transparent'}
            />
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
          <AnimatedProgressBar progress={progress} color={colors.gold} />
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{completedModules.length} lessons</Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>{item?.total_duration || '—'}</Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.resumeBtn} onPress={onPress} activeOpacity={0.8}>
          <Play size={12} color="#000" fill="#000" />
          <Text style={styles.resumeBtnText}>RESUME LESSON</Text>
        </TouchableOpacity>
      </Pressable>
    );
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
        <Text style={styles.archivedMeta}>
          Spent {item?.time_spent || '0h'} out of {item?.total_duration || '—'}
        </Text>

        {/* Progress */}
        <View style={{ paddingHorizontal: wp(14), marginBottom: hp(4) }}>
          <AnimatedProgressBar progress={progress} color="#8B5CF6" />
        </View>
        <Text style={styles.archivedPercent}>{progress}%</Text>

        {/* Buttons */}
        <View style={styles.archivedBtnRow}>
          <TouchableOpacity style={styles.restoreBtn} activeOpacity={0.8}>
            <Text style={styles.restoreBtnText}>Restore</Text>
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
            <Text style={styles.completedBadgeText}>✓ COURSE COMPLETED</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.completedTitle}>{courseTitle}</Text>
        <Text style={styles.completedDate}>
          Completed on{' '}
          {item?.completed_at
            ? new Date(item.completed_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '—'}
        </Text>
        <Text style={styles.completedDuration}>
          ⏱ {item?.total_duration || '—'} total
        </Text>

        {/* Certificate Button */}
        <TouchableOpacity style={styles.certificateBtn} activeOpacity={0.8}>
          <Award size={14} color={colors.white} />
          <Text style={styles.certificateBtnText}>Download Certificate</Text>
        </TouchableOpacity>

        {/* Review Button */}
        <TouchableOpacity style={styles.reviewBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.reviewBtnText}>Review Course</Text>
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
    backgroundColor: colors.inputBg,
  },
  progressTrack: {
    height: hp(4),
    backgroundColor: colors.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },

  // ── Ongoing ─────────────────────────────────────────────────────────────────
  ongoingCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(16),
    marginBottom: hp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredBadge: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  featuredBadgeText: {
    fontSize: fp(9),
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 99,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  priorityBadgeText: {
    fontSize: fp(9),
    color: '#EF4444',
    fontWeight: '700',
  },
  ongoingTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.textPrimary,
    padding: wp(14),
    paddingBottom: hp(8),
    lineHeight: fp(26),
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    paddingHorizontal: wp(14),
    marginBottom: hp(6),
  },
  moduleText: {
    fontSize: fp(12),
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold,
  },
  metaRow: {
    flexDirection: 'row',
    gap: wp(6),
    paddingHorizontal: wp(14),
    marginTop: hp(8),
    marginBottom: hp(12),
  },
  metaText: {
    fontSize: fp(11),
    color: colors.textMuted,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: colors.gold,
    marginHorizontal: wp(14),
    marginBottom: hp(14),
    borderRadius: 8,
    paddingVertical: hp(12),
  },
  resumeBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: fp(13),
    letterSpacing: 0.5,
  },

  // ── Archived ─────────────────────────────────────────────────────────────────
  archivedCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(16),
    marginBottom: hp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  archivedBadge: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  archivedBadgeText: {
    fontSize: fp(9),
    color: '#8B5CF6',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  archivedTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.textPrimary,
    padding: wp(14),
    paddingBottom: hp(4),
  },
  archivedMeta: {
    fontSize: fp(12),
    color: colors.textMuted,
    paddingHorizontal: wp(14),
    marginBottom: hp(8),
  },
  archivedPercent: {
    fontSize: fp(11),
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: wp(14),
    marginTop: hp(4),
    marginBottom: hp(12),
    textAlign: 'right',
  },
  archivedBtnRow: {
    flexDirection: 'row',
    gap: wp(10),
    paddingHorizontal: wp(14),
    paddingBottom: hp(14),
  },
  restoreBtn: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: hp(10),
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  syllabusBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: fp(13),
  },

  // ── Completed ────────────────────────────────────────────────────────────────
  completedCard: {
    backgroundColor: colors.surface,
    borderRadius: wp(16),
    marginBottom: hp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  completedBadge: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 6,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  completedBadgeText: {
    fontSize: fp(9),
    color: '#22C55E',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completedTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.textPrimary,
    padding: wp(14),
    paddingBottom: hp(4),
  },
  completedDate: {
    fontSize: fp(12),
    color: colors.textSecondary,
    paddingHorizontal: wp(14),
    marginBottom: hp(4),
  },
  completedDuration: {
    fontSize: fp(12),
    color: colors.textMuted,
    paddingHorizontal: wp(14),
    marginBottom: hp(12),
  },
  certificateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: '#4F46E5',
    marginHorizontal: wp(14),
    marginBottom: hp(8),
    borderRadius: 8,
    paddingVertical: hp(12),
  },
  certificateBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(13),
  },
  reviewBtn: {
    alignItems: 'center',
    paddingVertical: hp(10),
    marginBottom: hp(14),
  },
  reviewBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fp(13),
  },
});