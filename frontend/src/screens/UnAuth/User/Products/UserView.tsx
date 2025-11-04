import React, { useState, memo, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import {
  Users,
  Clock,
  Play,
  Search,
  BookOpen,
  Star,
} from 'lucide-react-native';
import Video from 'react-native-video';
import colors from '../../../../utils/colors';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;
const CARD_MARGIN = 12;

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

  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState<{ [key: string]: boolean }>(
    {},
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchCourses({}));
    dispatch(getEnrolledCourses({}));

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePlay = (id: string) => {
    setPlayingVideoId(id);
    setVideoLoading(prev => ({ ...prev, [id]: true }));
  };

  const handleEnded = () => {
    setPlayingVideoId(null);
  };

  const handleVideoLoad = (id: string) => {
    setVideoLoading(prev => ({ ...prev, [id]: false }));
  };

  const handleVideoError = (id: string) => {
    setVideoLoading(prev => ({ ...prev, [id]: false }));
    setPlayingVideoId(null);
  };

  const enrolledCourseIds = (enrolledCourses.enrollments || []).map(
    (enrollment: any) => enrollment.course_id,
  );
  const myCourses = (allCourses?.data?.courses || []).filter((course: any) =>
    enrolledCourseIds.includes(course.id || course._id),
  );

  const browseCourses = allCourses?.data?.courses || [];

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetailsScreen', { courseId });
  };

  const getVideoUrl = (course: any) => {
    return (
      course.videos?.[0]?.video_url ||
      course.videos?.[0]?.url ||
      course?.videos?.playback_url ||
      null
    );
  };

  const getRating = (course: any) => {
    return course.rating || course.average_rating || 4.5; // Default rating
  };

  const renderCard = ({ item, isEnrolled }: any) => {
    const courseId = item.id || item._id;
    const isPlaying = playingVideoId === courseId;
    const price = item.price === 0 ? 'Free' : `₹${item.price}`;
    const videoUrl = getVideoUrl(item);
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
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Video/Thumbnail Section */}
        <View style={styles.mediaContainer}>
          {isPlaying ? (
            <View style={styles.videoContainer}>
              {videoLoading[courseId] && (
                <View style={styles.videoLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              <Video
                source={{ uri: item?.videos?.playback_url }}
                style={styles.videoPlayer}
                resizeMode="cover"
                paused={!isPlaying}
                onEnd={handleEnded}
                onLoad={() => handleVideoLoad(courseId)}
                onError={() => handleVideoError(courseId)}
                controls={true}
                playWhenInactive={false}
                playInBackground={false}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.thumbnailContainer}
              onPress={item?.videos?.playback_url ? () => handlePlay(courseId) : undefined}
              activeOpacity={item?.videos?.playback_url ? 0.7 : 1}
            >
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

              {item?.videos?.playback_url && (
                <View style={styles.playOverlay}>
                  <View style={styles.playCircle}>
                    <Play size={24} color="#fff" fill="#fff" />
                  </View>
                </View>
              )}

              {/* Course Level Badge */}
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
            </TouchableOpacity>
          )}
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
      </Animated.View>
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
    <Animated.ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroHeading}>Learn from experts</Text>
        <Text style={styles.heroSub}>
          Browse courses and start learning today
        </Text>
      </View>

      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => {
          console.log('--- Search Pressed ---');
        }}
      >
        <Search
          size={18}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <View style={styles.searchInput}>
          <Text style={styles.searchPlaceholder}>
            Search courses or instructors...
          </Text>
        </View>
      </TouchableOpacity>

      {myCourses && myCourses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Your Courses</Text>
          <FlatList
            data={myCourses}
            keyExtractor={i => i.id || i._id}
            renderItem={({ item }) => renderCard({ item, isEnrolled: true })}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={CARD_WIDTH + CARD_MARGIN}
            decelerationRate="fast"
          />
        </View>
      )}

      <View style={styles.section}>
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
              const isEnrolled = enrolledCourseIds.includes(
                item.id || item._id,
              );
              return renderCard({ item, isEnrolled });
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={CARD_WIDTH + CARD_MARGIN}
            decelerationRate="fast"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No courses available</Text>
              </View>
            }
          />
        )}
      </View>
    </Animated.ScrollView>
  );
};

export default UserView;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    backgroundColor: colors.white,
  },
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
  heroSub: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
  },
  searchPlaceholder: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  listContent: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 8,
  },
  mediaContainer: {
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  thumbnailContainer: {
    position: 'relative',
  },
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
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
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
  instructor: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  enrolledText: {
    color: colors.success,
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'flex-end',
  },
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
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
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
    width: CARD_WIDTH,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
