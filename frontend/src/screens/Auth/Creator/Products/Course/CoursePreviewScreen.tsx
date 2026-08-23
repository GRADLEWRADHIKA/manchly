import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import {
  BookOpen,
  Clock,
  Play,
  IndianRupee,
  BarChart3,
  Users,
  Video,
  CheckCircle,
} from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import {wp, hp, fp} from '../../../../../utils/responsive';
import CourseWizardHeader from '../../../../../components/CourseWizardHeader';
import {getCourseById, updateCourse} from '../../../../../store/CourseSlice';

const GOLD = '#F0C040';

const formatDuration = (seconds: number) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const CoursePreviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const courseId = route.params?.courseId;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    dispatch(getCourseById(courseId))
      .unwrap()
      .then((data: any) => {
        setCourse(data?.course || data);
      })
      .catch(() => {
        Toast.show({type: 'error', text1: 'Failed to load course', position: 'top'});
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const videos = (course?.videos || [])
    .slice()
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const totalDuration = videos.reduce(
    (sum: number, v: any) => sum + (Number(v.duration) || 0),
    0,
  );

  const handlePublish = () => {
    setPublishing(true);
    dispatch(
      updateCourse({
        id: courseId,
        body: {status: 'PUBLISHED'},
      }),
    )
      .unwrap()
      .then(() => {
        Toast.show({type: 'success', text1: 'Course published!', position: 'top'});
        navigation.navigate('CreatorBottomTab');
      })
      .catch(() => {
        Toast.show({type: 'error', text1: 'Failed to publish', position: 'top'});
      })
      .finally(() => setPublishing(false));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CourseWizardHeader activeStep={2} title="Preview" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      </View>
    );
  }

  const price = Number(course?.price || 0);

  return (
    <View style={styles.container}>
      <CourseWizardHeader
        activeStep={2}
        title="Preview"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          {course?.thumbnail || course?.thumbnail_url ? (
            <Image
              source={{uri: course.thumbnail || course.thumbnail_url}}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <BookOpen size={wp(40)} color={GOLD} strokeWidth={1.5} />
              <Text style={styles.thumbnailFallbackText}>No thumbnail</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.thumbnailGradient}
          />
          {videos.length > 0 && (
            <View style={styles.playBadge}>
              <Play size={wp(14)} color="#fff" fill="#fff" />
              <Text style={styles.playBadgeText}>
                {videos.length} Lesson{videos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Course Info */}
        <View style={styles.infoCard}>
          <Text style={styles.courseTitle}>{course?.title || 'Untitled Course'}</Text>
          <Text style={styles.courseDesc}>
            {course?.description || 'No description provided.'}
          </Text>

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BarChart3 size={wp(14)} color={GOLD} />
              <Text style={styles.metaText}>{course?.level || 'Beginner'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Video size={wp(14)} color={GOLD} />
              <Text style={styles.metaText}>{videos.length} Videos</Text>
            </View>
            {totalDuration > 0 && (
              <View style={styles.metaItem}>
                <Clock size={wp(14)} color={GOLD} />
                <Text style={styles.metaText}>{formatDuration(totalDuration)}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <IndianRupee size={wp(16)} color={GOLD} />
            <Text style={styles.priceText}>
              {price > 0 ? `${price.toLocaleString('en-IN')}` : 'Free'}
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Course Summary</Text>

          <SummaryRow label="Title" value={course?.title || '--'} />
          <SummaryRow label="Level" value={course?.level || 'Beginner'} />
          <SummaryRow
            label="Price"
            value={price > 0 ? `Rs. ${price.toLocaleString('en-IN')}` : 'Free'}
          />
          <SummaryRow label="Status" value={course?.status || 'DRAFT'} />
          <SummaryRow label="Videos" value={String(videos.length)} />
          {totalDuration > 0 && (
            <SummaryRow label="Duration" value={formatDuration(totalDuration)} />
          )}
          <SummaryRow
            label="Access"
            value={
              course?.access_duration_days
                ? `${course.access_duration_days} ${course.access_duration_unit || 'days'}`
                : 'Lifetime'
            }
            last
          />
        </View>

        {/* Video List */}
        {videos.length > 0 && (
          <View style={styles.videosCard}>
            <Text style={styles.summaryTitle}>Course Content</Text>
            {videos.map((v: any, i: number) => (
              <View
                key={v.id || i}
                style={[
                  styles.videoRow,
                  i < videos.length - 1 && styles.videoRowBorder,
                ]}>
                <View style={styles.videoOrderBadge}>
                  <Text style={styles.videoOrderText}>{i + 1}</Text>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {v.title || `Lesson ${i + 1}`}
                  </Text>
                  {v.duration > 0 && (
                    <Text style={styles.videoDuration}>
                      {formatDuration(v.duration)}
                    </Text>
                  )}
                </View>
                {v.is_free && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Almost There Banner */}
        <View style={styles.banner}>
          <CheckCircle size={wp(18)} color={GOLD} strokeWidth={2} />
          <View style={{flex: 1, marginLeft: wp(10)}}>
            <Text style={styles.bannerTitle}>Almost There!</Text>
            <Text style={styles.bannerSub}>
              Review your course details. You can go back and edit anytime.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          disabled={publishing}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePublish}
          disabled={publishing}
          activeOpacity={0.85}
          style={{flex: 1}}>
          <LinearGradient
            colors={['#F3C36B', '#D49A3D']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={[styles.publishBtn, publishing && {opacity: 0.7}]}>
            {publishing ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <Text style={styles.publishBtnText}>Publish Course</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SummaryRow = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[summaryStyles.row, !last && summaryStyles.rowBorder]}>
    <Text style={summaryStyles.label}>{label}</Text>
    <Text style={summaryStyles.value}>{value}</Text>
  </View>
);

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(10),
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.5)',
  },
  value: {
    fontSize: fp(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CoursePreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: wp(16),
    paddingBottom: hp(24),
  },

  // Thumbnail
  thumbnailWrap: {
    borderRadius: wp(16),
    overflow: 'hidden',
    backgroundColor: '#141414',
    marginBottom: hp(16),
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnailFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(8),
  },
  thumbnailFallbackText: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.4)',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  playBadge: {
    position: 'absolute',
    bottom: wp(12),
    left: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  playBadgeText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  courseTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: hp(6),
  },
  courseDesc: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(20),
    marginBottom: hp(14),
  },
  metaRow: {
    flexDirection: 'row',
    gap: wp(16),
    marginBottom: hp(12),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  metaText: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingTop: hp(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  priceText: {
    fontSize: fp(20),
    fontWeight: '800',
    color: GOLD,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp(8),
  },

  // Videos
  videosCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  videoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  videoOrderBadge: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(240,192,64,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  videoOrderText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: GOLD,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: fp(13.5),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoDuration: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(2),
  },
  freeBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  freeBadgeText: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#34D399',
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(240,192,64,0.08)',
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.2)',
    marginBottom: hp(8),
  },
  bannerTitle: {
    fontSize: fp(13),
    fontWeight: '700',
    color: GOLD,
  },
  bannerSub: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    marginTop: hp(2),
    lineHeight: fp(16),
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: wp(12),
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    flex: 1,
    paddingVertical: hp(13),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  backBtnText: {
    color: GOLD,
    fontWeight: '700',
    fontSize: fp(15),
  },
  publishBtn: {
    paddingVertical: hp(13),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: fp(15),
  },
});
