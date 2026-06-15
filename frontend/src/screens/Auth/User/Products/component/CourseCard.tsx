import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import colors from '../../../../../utils/colors';
import { Users, Clock, Play, BookOpen, Star } from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface CourseCardProps {
  item: any;
  isEnrolled: boolean;
  userType: string;
  handleCoursePress: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  item,
  isEnrolled,
  userType,
  handleCoursePress,
}) => {
  const courseId = item.id || item._id;
  const price = item.price === 0 ? 'Free' : `₹${item.price}`;
  const rating = item.rating || item.average_rating || 4.5;
  const instructorName =
    item.creator?.name || item.instructor?.name || 'Unknown Instructor';
  const studentsCount = item.enrollments?.length || item.students_count || 0;
  const videosCount = item.videos?.length || item.lessons_count || 0;
  const totalSeconds = item.videos?.reduce((sum: number, v: any) => sum + (v.duration || 0), 0) || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const duration = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  const level = item.level || 'Beginner';

  const thumbnailUrl =
    item.thumbnail || item.videos?.[0]?.thumbnail_url || item.image || null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => handleCoursePress(courseId)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <BookOpen size={wp(36)} color={colors.secPrimary} strokeWidth={1.2} />
            <Text style={styles.placeholderText}>{item.title || 'Course'}</Text>
          </View>
        )}

        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            {isEnrolled ? 'Enrolled' : price}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={wp(12)} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        <Text style={styles.instructor} numberOfLines={1}>
          by {instructorName}
        </Text>

        {/* Meta + Button row */}
        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Users size={wp(13)} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={styles.metaText}>{studentsCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <Play size={wp(13)} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={styles.metaText}>{videosCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={wp(13)} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={styles.metaText}>{duration}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.enrollBtn,
              {
                backgroundColor: isEnrolled
                  ? colors.success
                  : userType === 'USER'
                  ? colors.secPrimary
                  : colors.primary,
              },
            ]}
            onPress={() => handleCoursePress(courseId)}
          >
            <Text style={styles.enrollBtnText}>
              {isEnrolled ? 'Continue' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    overflow: 'hidden',
    marginBottom: hp(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(120),
    backgroundColor: '#F1F5F9',
  },
  placeholderThumbnail: {
    width: '100%',
    height: hp(120),
    backgroundColor: colors.secPrimary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(6),
  },
  placeholderText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.secPrimary,
    opacity: 0.6,
  },
  levelBadge: {
    position: 'absolute',
    top: wp(8),
    left: wp(8),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  levelText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    top: wp(8),
    right: wp(8),
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(8),
  },
  priceBadgeText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.white,
  },
  cardBody: {
    padding: wp(12),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: wp(8),
    lineHeight: fp(20),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70015',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: wp(6),
    gap: wp(3),
  },
  ratingText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: '#1A1A2E',
  },
  instructor: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(10),
  },
  metaRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  metaText: {
    fontSize: fp(11.5),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  enrollBtn: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(7),
    borderRadius: wp(8),
  },
  enrollBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(12),
  },
});
