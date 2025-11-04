import React, { useState, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Users, Clock, Play, Search } from 'lucide-react-native';
import Video from 'react-native-video';
import colors from '../../../utils/colors';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../store/CourseSlice';
import { getEnrolledCourses } from '../../../store/EnrollmentSlice';

const { width } = Dimensions.get('window');

const VideoThumb = memo(
  ({ id, videoUrl, thumbnailUrl, isPlaying, onPlay, onEnded }: any) => {
    if (!isPlaying) {
      return (
        <TouchableOpacity
          onPress={() => onPlay(id)}
          activeOpacity={0.9}
          style={styles.videoShell}
        >
          <Image source={{ uri: thumbnailUrl }} style={styles.videoThumbImage} />
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Play size={28} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.videoShell}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.videoPlayerFill}
          resizeMode="cover"
          controls
          paused={false}
          onEnd={onEnded}
        />
      </View>
    );
  },
);

const UserView: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { list: allCourses, loading: coursesLoading } = useSelector(
    (state: any) => state.coursesReducer
  );
  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer
  );

  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all courses and enrolled courses when component mounts
    dispatch(fetchCourses({}));
    dispatch(getEnrolledCourses({}));
  }, []);

  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  console.log('allCourses', allCourses);
  console.log('enrolledCourses', enrolledCourses);
  // Filter courses that user is enrolled in
  const enrolledCourseIds = (enrolledCourses.enrollments || []).map((enrollment: any) => enrollment.course_id);
  const myCourses = (allCourses?.data?.courses || []).filter((course: any) =>
    enrolledCourseIds.includes(course.id || course._id)
  );

  // Browse courses (all courses)
  const browseCourses = allCourses?.data?.courses || [];

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetailsScreen', { courseId });
  };

  const renderCard = ({ item, isEnrolled }: any) => {
    const courseId = item.id || item._id;
    const isPlaying = playingVideoId === courseId;
    const price = item.price === 0 ? 'Free' : `₹${item.price}`;
    
    // Extract instructor name from creator object
    const instructorName = item.creator?.name || 'Unknown Instructor';
    
    // Calculate stats from the response
    const studentsCount = item.enrollments?.length || 0;
    const videosCount = item.videos?.length || 0;
    
    // Get first video thumbnail or course thumbnail
    const thumbnailUrl = item.thumbnail || item.videos?.[0]?.thumbnail_url || null;

    return (
      <View style={styles.card}>
        {thumbnailUrl ? (
          <Image 
            source={{ uri: thumbnailUrl }} 
            style={styles.courseThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Play size={40} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
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
              <Text style={styles.metaText}>{videosCount} videos</Text>
            </View>
            
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                {isEnrolled ? 'Enrolled' : price}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor:
                    user?.user_type === 'USER'
                      ? colors.secPrimary
                      : colors.primary,
                },
              ]}
              onPress={() => handleCoursePress(courseId)}
            >
              <Text style={styles.primaryButtonText}>
                {isEnrolled ? 'Continue Learning' : 'View Course'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={() => handleCoursePress(courseId)}
            >
              <Text style={styles.outlineButtonText}>Details</Text>
            </TouchableOpacity>
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
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.hero}>
        <Text style={styles.heroHeading}>Learn from experts</Text>
        <Text style={styles.heroSub}>
          Browse courses and start learning today
        </Text>
      </View>

      {/* 🔍 Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => {
          console.log('--- Search Pressed ---');
        }}
      >
        <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <View style={styles.searchInput}>
          <Text>Search courses or instructors...</Text>
        </View>
      </TouchableOpacity>

      {myCourses && myCourses.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionHeading}>Your Courses</Text>
          <FlatList
            data={myCourses}
            keyExtractor={i => i.id || i._id}
            renderItem={({ item }) => renderCard({ item, isEnrolled: true })}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16 }}
          />
        </View>
      )}

      {/* 🎥 All Courses */}
      <Text style={styles.sectionHeading}>Browse Courses</Text>
      {coursesLoading && !browseCourses?.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={browseCourses}
          keyExtractor={i => i.id || i._id}
          renderItem={({ item }) => {
            const isEnrolled = enrolledCourseIds.includes(item.id || item._id);
            return renderCard({ item, isEnrolled });
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No courses available</Text>
            </View>
          }
        />
      )}
    </ScrollView>
  );
};

export default UserView;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  hero: { padding: 16 },
  heroHeading: { fontSize: 22, fontWeight: '700', color: colors.text },
  heroSub: { color: colors.textSecondary, marginTop: 6 },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 4,
  },
  videoShell: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 200,
  },
  videoThumbImage: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerFill: { width: '100%', height: '100%' },
  courseThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
  },
  placeholderThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width - 60,
    marginRight: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBody: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  instructor: { color: colors.textSecondary, marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, color: colors.textSecondary },
  priceTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priceText: { color: colors.text },
  footerRow: { flexDirection: 'row', marginTop: 12 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: { marginRight: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  outlineButton: { borderWidth: 1, borderColor: colors.border },
  outlineButtonText: { color: colors.text },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
});
