import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import colors from '../../../../../utils/colors';
import { Users, Clock, Play, BookOpen, Star } from 'lucide-react-native';

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
  const duration = item.duration || '8h 30m';
  const level = item.level || 'Beginner';

  const thumbnailUrl =
    item.thumbnail || item.videos?.[0]?.thumbnail_url || item.image || null;

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <View style={styles.mediaContainer}>
        <TouchableOpacity style={styles.thumbnailContainer} activeOpacity={1}>
          {thumbnailUrl ? (
            <Image source={{ uri: thumbnailUrl }} style={styles.courseThumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <BookOpen size={40} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        <Text style={styles.instructor} numberOfLines={1}>
          by {instructorName}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{studentsCount}</Text>
          </View>

          <View style={styles.metaItem}>
            <Play size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{videosCount}</Text>
          </View>

          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, isEnrolled && styles.enrolledText]}>
              {isEnrolled ? 'Enrolled' : price}
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
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
              <Text style={styles.primaryButtonText}>
                {isEnrolled ? 'Continue' : 'Enroll Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={() => handleCoursePress(courseId)}
            >
              <Text style={styles.outlineButtonText}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    marginBottom: 16,
  },
  mediaContainer: { position: 'relative' },
  thumbnailContainer: { position: 'relative' },
  courseThumbnail: { width: '100%', height: 180 },
  placeholderThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#00000099',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    color: colors.text,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70022',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { fontSize: 12, fontWeight: '600', marginLeft: 2 },
  instructor: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
  metaRow: { flexDirection: 'row', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  metaText: { marginLeft: 4, color: colors.textSecondary },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  enrolledText: { color: colors.success, fontSize: 14 },
  buttonGroup: { flexDirection: 'row' },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryButton: {},
  primaryButtonText: { color: colors.white, fontWeight: '600' },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButtonText: { color: colors.text, fontWeight: '600' },
  priceContainer: { flex: 1 },
});
