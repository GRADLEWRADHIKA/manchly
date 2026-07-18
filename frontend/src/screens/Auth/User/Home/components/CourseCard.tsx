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
        {item?.course?.thumbnail_url || item?.course?.thumbnail ? (
          <Image
            source={{ uri: item.course.thumbnail_url || item.course.thumbnail }}
            style={styles.thumbnailImage}
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <BookOpen size={wp(28)} color={colors.textMuted} strokeWidth={1.4} />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {(item?.course?.category || item?.course?.duration) && (
          <View style={styles.tagsRow}>
            {item?.course?.category && (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.course.category}</Text>
              </View>
            )}
            {item?.course?.duration && (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.course.duration} HOURS</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {item?.course?.title || 'Untitled'}
        </Text>
      </View>
    </Pressable>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    width: wp(160),
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    overflow: 'hidden',
    marginBottom: hp(12),
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
  thumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.inputBg,
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: wp(10),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(6),
    marginBottom: hp(8),
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: wp(7),
    paddingVertical: hp(2),
    borderRadius: wp(5),
  },
  tagText: {
    fontSize: fp(8.5),
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(18),
  },
});