import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  Users,
  Clock,
  Play,
  Search,
  BookOpen,
  Star,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import CustomTextInput from '../../../../components/CustomInput';

const UserView: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { list: allCourses, loading: coursesLoading } = useSelector(
    (state: any) => state.coursesReducer,
  );
  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchCourses({}));
    dispatch(getEnrolledCourses({}));
  }, []);

  const enrolledCourseIds = (enrolledCourses.enrollments || []).map(
    (enrollment: any) => enrollment.course_id,
  );

  const browseCourses = allCourses?.data?.courses || [];

  const filteredCourses = browseCourses.filter((course: any) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetailsScreen', { courseId });
  };

  const getRating = (course: any) => {
    return course.rating || course.average_rating || 4.5;
  };

  const renderCard = ({ item, isEnrolled }: any) => {
    const courseId = item.id || item._id;
    const price = item.price === 0 ? 'Free' : `₹${item.price}`;
    const rating = getRating(item);
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
        {/* Thumbnail Section */}
        <View style={styles.mediaContainer}>
          <TouchableOpacity style={styles.thumbnailContainer} activeOpacity={1}>
            {thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.courseThumbnail}
                resizeMode="cover"
              />
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

        {/* Card Content */}
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
              <Text
                style={[styles.priceText, isEnrolled && styles.enrolledText]}
              >
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
                      : user?.user_type === 'USER'
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

  if (coursesLoading && !allCourses?.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroHeading}>Learn from experts</Text>
      </View>

      {/* 🔍 Search Bar */}
      <View style={styles.searchContainer}>
        <Search
          size={18}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <CustomTextInput
          inputContainerStyle={[
            styles.searchInput,
            {
              borderColor: colors.borderColor,
            },
          ]}
          inputStyle={{
            fontSize: 16,
            color: colors.black,
          }}
          placeholderTextColor={colors.borderColor}
          placeholder="Search courses"
          onChange={setSearchQuery}
          value={searchQuery}
        />
        {/* <TextInput
          placeholder="Search courses or instructors..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        /> */}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Browse Courses</Text>
        {coursesLoading && !filteredCourses?.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={i => i.id || i._id}
            renderItem={({ item }) => {
              const isEnrolled = enrolledCourseIds.includes(
                item.id || item._id,
              );
              return renderCard({ item, isEnrolled });
            }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 250 }}
            decelerationRate="fast"
            removeClippedSubviews
            initialNumToRender={5}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No courses found</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default UserView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  hero: {
    padding: 20,
    paddingBottom: 16,
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    // paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  thumbnailContainer: { position: 'relative' },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    marginBottom: 16,
  },
  mediaContainer: { position: 'relative' },
  courseThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface,
  },
  placeholderThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  priceContainer: { flex: 1 },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 2,
  },
  instructor: { color: colors.textSecondary, fontSize: 14, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { marginLeft: 4, color: colors.textSecondary, fontSize: 12 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  enrolledText: { color: colors.success, fontSize: 14 },
  buttonGroup: { flexDirection: 'row', justifyContent: 'flex-end' },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  nameFields: {
    paddingHorizontal: 10,
    height: 44,
    width: '100%',
    backgroundColor: colors.lightGrey,
    marginBottom: 20,
  },
});
