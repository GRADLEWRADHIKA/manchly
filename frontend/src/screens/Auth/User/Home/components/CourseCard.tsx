import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const CourseCard = ({ item }) => {
  const navigation = useNavigation<any>();
  const progress = item?.progress || 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate('UserVideoList', { item })}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.placeholderThumbnail}>
          <BookOpen size={wp(28)} color={colors.secPrimary} strokeWidth={1.4} />
        </View>

        {item?.course?.level && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{item.course.level}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item?.course?.title || 'Untitled'}
        </Text>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
                progress === 100 && styles.progressComplete,
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.continueText}>
            {progress === 100 ? 'Review' : 'Continue'}
          </Text>
          <ChevronRight size={wp(14)} color={colors.secPrimary} />
        </View>
      </View>
    </Pressable>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    overflow: 'hidden',
    marginBottom: hp(12),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  thumbnailContainer: {
    width: '100%',
    height: hp(90),
    position: 'relative',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E3A5F08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: hp(8),
    left: wp(8),
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  levelText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '600',
  },
  cardBody: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.text,
    lineHeight: fp(18),
    marginBottom: hp(8),
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(8),
  },
  progressBar: {
    flex: 1,
    height: hp(4),
    backgroundColor: '#f1f5f9',
    borderRadius: wp(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secPrimary,
    borderRadius: wp(2),
  },
  progressComplete: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: colors.secPrimary,
    minWidth: wp(26),
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: wp(2),
  },
  continueText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.secPrimary,
  },
});
