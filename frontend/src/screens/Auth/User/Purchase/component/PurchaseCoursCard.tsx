import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import colors from '../../../../../utils/colors';
import {
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const AnimatedProgressBar = ({ progress, isComplete }: any) => {
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
    <View style={styles.progressBar}>
      <Animated.View
        style={[
          styles.progressFill,
          { width },
          isComplete && styles.progressFillComplete,
        ]}
      />
    </View>
  );
};

const PurchaseCoursCard = ({ item, transaction, onPress }) => {
  const courseTitle = item?.course?.title || 'Untitled Course';
  const enrolledDate = item.enrolled_at || item.created_at;
  const progress = item.progress || 0;
  const isComplete = progress === 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top accent strip */}
      <View
        style={[
          styles.accentStrip,
          { backgroundColor: isComplete ? colors.success : colors.secPrimary },
        ]}
      />

      <View style={styles.cardInner}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              isComplete && styles.iconContainerComplete,
            ]}
          >
            {isComplete ? (
              <CheckCircle2 size={wp(20)} color={colors.success} strokeWidth={2} />
            ) : (
              <GraduationCap
                size={wp(20)}
                color={colors.secPrimary}
                strokeWidth={2}
              />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>
              {courseTitle}
            </Text>
            <View style={styles.metaRow}>
              {enrolledDate && (
                <Text style={styles.date}>
                  {new Date(enrolledDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {transaction && (
                <>
                  <View style={styles.metaDot} />
                  <Text style={styles.priceValue}>
                    ₹{transaction.amount}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <View style={styles.progressLeftLabel}>
              <BookOpen
                size={wp(13)}
                color={isComplete ? colors.success : colors.textSecondary}
                strokeWidth={1.8}
              />
              <Text style={styles.progressLabel}>
                {isComplete ? 'Course completed' : 'Your progress'}
              </Text>
            </View>
            <Text
              style={[
                styles.progressPercent,
                isComplete && styles.progressComplete,
              ]}
            >
              {progress}%
            </Text>
          </View>

          <AnimatedProgressBar progress={progress} isComplete={isComplete} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View
            style={[
              styles.statusBadge,
              isComplete ? styles.completedBadge : styles.inProgressBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isComplete ? styles.completedText : styles.inProgressText,
              ]}
            >
              {isComplete ? 'Completed' : 'In Progress'}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.actionText}>
              {isComplete ? 'Review' : 'Continue Learning'}
            </Text>
            <ChevronRight size={wp(16)} color={colors.secPrimary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default PurchaseCoursCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    marginBottom: hp(14),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ecf0',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.93,
    transform: [{ scale: 0.98 }],
  },
  accentStrip: {
    height: hp(3.5),
    width: '100%',
  },
  cardInner: {
    padding: wp(16),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(14),
  },
  iconContainer: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    backgroundColor: '#1E3A5F0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F12',
  },
  iconContainerComplete: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10B98120',
  },
  headerText: {
    flex: 1,
    marginLeft: wp(12),
  },
  title: {
    fontSize: fp(15.5),
    fontWeight: '600',
    color: colors.text,
    lineHeight: fp(21),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(4),
    gap: wp(6),
  },
  metaDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    backgroundColor: colors.muted,
  },
  date: {
    fontSize: fp(12),
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  progressSection: {
    backgroundColor: '#f8fafc',
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(14),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  progressLeftLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  progressLabel: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: fp(13),
    color: colors.secPrimary,
    fontWeight: '700',
  },
  progressComplete: {
    color: colors.success,
  },
  progressBar: {
    height: hp(7),
    backgroundColor: '#e8ecf0',
    borderRadius: wp(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secPrimary,
    borderRadius: wp(4),
  },
  progressFillComplete: {
    backgroundColor: colors.success,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: hp(5),
    paddingHorizontal: wp(12),
    borderRadius: wp(8),
  },
  completedBadge: {
    backgroundColor: '#ecfdf5',
  },
  inProgressBadge: {
    backgroundColor: '#1E3A5F0A',
  },
  statusText: {
    fontSize: fp(11.5),
    fontWeight: '600',
  },
  completedText: {
    color: colors.success,
  },
  inProgressText: {
    color: colors.secPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  actionText: {
    color: colors.secPrimary,
    fontWeight: '600',
    fontSize: fp(13),
  },
});
