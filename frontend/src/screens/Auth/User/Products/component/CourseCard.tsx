import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import colors from '../../../../../utils/colors';
import { Users, Clock, Play, BookOpen } from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';

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
          <Image 
            source={{ uri: thumbnailUrl }} 
            style={styles.thumbnail} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <BookOpen size={wp(36)} color={colors.user.accentText} strokeWidth={1.2} />
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
        </View>

        <Text style={styles.instructor} numberOfLines={1}>
          by {instructorName}
        </Text>

        {/* Meta + Button row */}
        <View style={styles.footerRow}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Users size={wp(13)} color={colors.user.subHeading} strokeWidth={1.8} />
              <Text style={styles.metaText}>{studentsCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <Play size={wp(13)} color={colors.user.subHeading} strokeWidth={1.8} />
              <Text style={styles.metaText}>{videosCount}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={wp(13)} color={colors.user.subHeading} strokeWidth={1.8} />
              <Text style={styles.metaText}>{duration}</Text>
            </View>
          </View>
          
          {/* Fixed Gradient Button */}
          <TouchableOpacity
            style={styles.enrollBtnWrapper}
            activeOpacity={0.85}
            onPress={() => handleCoursePress(courseId)}
          >
            <LinearGradient
  colors={
    isEnrolled
      ? ['#86EFAC', '#4ADE80']
      : ['#4ADE80', '#16A34A']
  }
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.enrollBtnGradient}
>
              <Text style={styles.enrollBtnText}>
                {isEnrolled ? 'Continue' : 'Enroll Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    overflow: 'hidden',
    marginBottom: hp(12),
  },
  thumbnailWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.greenButton,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(6),
  },
  placeholderText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.user.accentText,
    opacity: 0.6,
  },
  levelBadge: {
    position: 'absolute',
    top: wp(8),
    left: wp(8),
    backgroundColor: colors.user.accent,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  levelText: {
    color: colors.user.text,
    fontSize: fp(11),
    fontWeight: '600',
  },
  priceBadge: {
    position: 'absolute',
    top: wp(8),
    right: wp(8),
    backgroundColor: colors.user.accent,
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(8),
  },
  priceBadgeText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.user.accentText,
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
    color: colors.user.text,
    lineHeight: fp(20),
  },
  instructor: {
    fontSize: fp(12),
    color: colors.user.accentText,
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
    gap: wp(12),
    marginTop: hp(6),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(11.5),
    color: colors.user.subHeading,
    fontWeight: '500',
  },
  enrollBtnWrapper: {
    borderRadius: wp(8),
    overflow: 'hidden',
  },
  enrollBtnGradient: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollBtnText: {
    color: colors.user.accentText,
    fontWeight: '700',
    fontSize: fp(12),
    letterSpacing: 0.3,
  },
});