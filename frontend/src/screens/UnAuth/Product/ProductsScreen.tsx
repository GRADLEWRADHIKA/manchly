// PurchasesScreen.tsx
import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Users, Clock, Plus } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import colors from '../../../theme/colors';
import { useAppSelector } from '../../../store/hooks';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

/* ----------------------------- Shared VideoThumb ---------------------------- */
type VideoThumbProps = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onEnded?: () => void;
  height?: number;
};

const VideoThumb = memo(
  ({
    id,
    videoUrl,
    thumbnailUrl,
    isPlaying,
    onPlay,
    onEnded,
    height = 200,
  }: VideoThumbProps) => {
    if (!isPlaying) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onPlay(id)}
          style={[sharedStyles.videoShell, { height }]}
        >
          <Image
            source={{ uri: thumbnailUrl }}
            style={sharedStyles.videoThumbImage}
          />
          <View style={sharedStyles.playOverlay}>
            <View style={sharedStyles.playCircle}>
              <Play size={28} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[sharedStyles.videoShell, { height }]}>
        <Video
          source={{ uri: videoUrl }}
          style={sharedStyles.videoPlayerFill}
          resizeMode="cover"
          controls
          paused={false}
          onEnd={onEnded}
        />
      </View>
    );
  },
);

/* ------------------------------- Mock Data --------------------------------- */
const creatorCourses = [
  {
    id: 'c1',
    title: 'Master Digital Marketing',
    instructor: 'Sarah Johnson',
    thumbnail:
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: 2500,
    duration: '4.5 hours',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    lessons: [
      { id: 'l1', title: 'Intro to Marketing', duration: '12m' },
      { id: 'l2', title: 'Content Strategy', duration: '28m' },
      { id: 'l3', title: 'SEO Fundamentals', duration: '34m' },
    ],
  },
  {
    id: 'c2',
    title: 'Content Creation Bootcamp',
    instructor: 'Mike Chen',
    thumbnail:
      'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: 1800,
    duration: '6 hours',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    lessons: [
      { id: 'l4', title: 'Camera Basics', duration: '20m' },
      { id: 'l5', title: 'Editing Workflow', duration: '45m' },
    ],
  },
];

const userVideos = [
  {
    id: 'f1',
    title: 'Digital Marketing Masterclass',
    instructor: 'Sarah Johnson',
    thumbnail:
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: '2.5K',
    duration: '4.5 hours',
    price: '$29',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'f2',
    title: 'Content Creation Bootcamp',
    instructor: 'Mike Chen',
    thumbnail:
      'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: '1.8K',
    duration: '6 hours',
    price: 'Free',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'f3',
    title: 'SEO Advanced Tips — Part 1',
    instructor: 'Priya Singh',
    thumbnail:
      'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: '900',
    duration: '35m',
    price: '$9',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
];

/* ---------------------------- Creator Component ---------------------------- */
const CreatorView: React.FC = () => {
  const Nav = useNavigation<any>();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  const renderCourseCard = ({ item }: any) => {
    const isPlaying = playingVideoId === item.id;
    return (
      <View style={creatorStyles.courseCard}>
        <View style={creatorStyles.cardHeader}>
          <Text style={creatorStyles.courseTitle}>{item.title}</Text>
          <Text style={creatorStyles.courseInstructor}>
            by {item.instructor}
          </Text>
        </View>

        <VideoThumb
          id={item.id}
          videoUrl={item.videoUrl}
          thumbnailUrl={item.thumbnail}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onEnded={handleEnded}
          height={200}
        />

        <View style={creatorStyles.cardFooter}>
          <View style={creatorStyles.metaRow}>
            <View style={creatorStyles.metaItem}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={creatorStyles.metaText}>{item.students}</Text>
            </View>
            <View style={[creatorStyles.metaItem, { marginLeft: 12 }]}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={creatorStyles.metaText}>{item.duration}</Text>
            </View>
          </View>

          <View style={creatorStyles.actionsRow}>
            <TouchableOpacity
              style={[creatorStyles.btn, creatorStyles.btnPrimary]}
              // onPress={() => Nav.navigate('EditCourse', { courseId: item.id })}
            >
              <Text style={creatorStyles.btnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[creatorStyles.btn, creatorStyles.btnOutline]}
              // onPress={() => Nav.navigate('Analytics', { courseId: item.id })}
            >
              <Text
                style={[creatorStyles.btnText, creatorStyles.btnOutlineText]}
              >
                Analytics
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={sharedStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={creatorStyles.heroSection}>
        <Text style={creatorStyles.heroHeading}>Welcome back, Creator 👋</Text>
        <Text style={creatorStyles.heroSub}>
          Manage your courses, go live and track performance.
        </Text>

        <View style={creatorStyles.quickRow}>
          <View style={creatorStyles.quickCard}>
            <Text style={creatorStyles.quickValue}>12</Text>
            <Text style={creatorStyles.quickLabel}>Active Courses</Text>
          </View>

          <View style={creatorStyles.quickCard}>
            <Text style={creatorStyles.quickValue}>5.2K</Text>
            <Text style={creatorStyles.quickLabel}>Students</Text>
          </View>

          <View style={creatorStyles.quickCard}>
            <Text style={creatorStyles.quickValue}>94%</Text>
            <Text style={creatorStyles.quickLabel}>Completion</Text>
          </View>
        </View>
      </View>

      <View style={creatorStyles.sectionHeaderRow}>
        <Text style={creatorStyles.sectionTitle}>Your Courses</Text>
        <TouchableOpacity
        // onPress={() => Nav.navigate('CreateCourse')}
        >
          <Text style={creatorStyles.seeAllText}>Create new</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={creatorCourses}
        keyExtractor={i => i.id}
        renderItem={renderCourseCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={creatorStyles.featuredScrollContent}
      />

      <View style={creatorStyles.sectionTitleBlock}>
        <Text style={creatorStyles.sectionTitle}>Recent Lessons</Text>
      </View>

      {creatorCourses.map(course => (
        <View key={course.id} style={creatorStyles.lessonsBlock}>
          <Text style={creatorStyles.lessonCourseTitle}>{course.title}</Text>
          {course.lessons.map((l: any) => (
            <View key={l.id} style={creatorStyles.lessonRow}>
              <Text style={creatorStyles.lessonTitle}>{l.title}</Text>
              <Text style={creatorStyles.lessonDuration}>{l.duration}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

/* ------------------------------ User Component ----------------------------- */
const UserView: React.FC = () => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const userType = useAppSelector(state => state.auth.userType);

  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  const renderCard = ({ item }: any) => {
    const isPlaying = playingVideoId === item.id;
    return (
      <View style={userStyles.card}>
        <VideoThumb
          id={item.id}
          videoUrl={item.videoUrl}
          thumbnailUrl={item.thumbnail}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onEnded={handleEnded}
          height={200}
        />

        <View style={userStyles.cardBody}>
          <Text style={userStyles.title}>{item.title}</Text>
          <Text style={userStyles.instructor}>by {item.instructor}</Text>

          <View style={userStyles.metaRow}>
            <View style={userStyles.metaItem}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={userStyles.metaText}>{item.students}</Text>
            </View>
            <View style={userStyles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={userStyles.metaText}>{item.duration}</Text>
            </View>
            <View style={userStyles.priceTag}>
              <Text style={userStyles.priceText}>{item.price}</Text>
            </View>
          </View>

          <View style={userStyles.footerRow}>
            <TouchableOpacity
              style={[
                userStyles.button,
                userStyles.primaryButton,
                {
                  backgroundColor:
                    userType === 'User' ? colors.secPrimary : colors.primary,
                },
              ]}
            >
              <Text style={userStyles.primaryButtonText}>Start Learning</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[userStyles.button, userStyles.outlineButton]}
            >
              <Text style={userStyles.outlineButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={sharedStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={userStyles.hero}>
        <Text style={userStyles.heroHeading}>Learn from experts</Text>
        <Text style={userStyles.heroSub}>
          Browse courses and start learning today
        </Text>
      </View>

      <Text style={userStyles.sectionTitle}>Recommended</Text>
      <FlatList
        data={userVideos}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
      />

      <Text style={userStyles.sectionTitle}>All Courses</Text>
      <View style={{ paddingHorizontal: 16 }}>
        {userVideos.map(v => (
          <View key={v.id} style={userStyles.listItem}>
            <Image source={{ uri: v.thumbnail }} style={userStyles.listThumb} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={userStyles.listTitle}>{v.title}</Text>
              <Text style={userStyles.listSubtitle}>
                {v.instructor} • {v.duration}
              </Text>
            </View>
            <Text style={userStyles.listPrice}>{v.price}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
};

/* ------------------------------- Wrapper Screen ---------------------------- */
const PurchasesScreen: React.FC = () => {
  const userType = useAppSelector(state => state.auth.userType);
  const Nav = useNavigation<any>();

  return (
    <View style={sharedStyles.container}>
      <AppHeader title="Manchly" />
      {userType === 'Creator' ? <CreatorView /> : <UserView />}

      {userType === 'Creator' && (
        <TouchableOpacity
          style={sharedStyles.fab}
          onPress={() => {
            Nav.navigate('CreateProducts');
          }}
          accessibilityLabel="Create course"
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PurchasesScreen;

/* --------------------------------- Styles --------------------------------- */
const sharedStyles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  videoShell: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});

/* ------------------------------- Creator Styles ---------------------------- */
const creatorStyles = StyleSheet.create({
  heroSection: { padding: 16 },
  heroHeading: { fontSize: 22, fontWeight: '700', color: colors.text },
  heroSub: { color: colors.textSecondary, marginTop: 6 },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    marginRight: 12,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  quickLabel: { fontSize: 12, color: colors.textSecondary },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  seeAllText: { color: colors.primary, fontWeight: '600' },

  featuredScrollContent: { paddingHorizontal: 4 },
  courseCard: {
    width: width - 60,
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  cardHeader: { padding: 12 },
  courseTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  courseInstructor: { color: colors.textSecondary, marginTop: 4 },
  cardFooter: { padding: 12 },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, color: colors.textSecondary },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary, marginRight: 8 },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutlineText: { color: colors.text },

  sectionTitleBlock: { paddingHorizontal: 16, marginTop: 16 },
  lessonsBlock: { padding: 16 },
  lessonCourseTitle: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  lessonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  lessonTitle: { color: colors.text },
  lessonDuration: { color: colors.textSecondary },
});

/* -------------------------------- User Styles ------------------------------ */
const userStyles = StyleSheet.create({
  hero: { padding: 16, paddingTop: 20 },
  heroHeading: { fontSize: 22, fontWeight: '700', color: colors.text },
  heroSub: { color: colors.textSecondary, marginTop: 6 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 16,
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
  priceTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: { color: colors.text },

  footerRow: { flexDirection: 'row', marginTop: 12 },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: { backgroundColor: colors.primary, marginRight: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  outlineButtonText: { color: colors.text },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  listThumb: { width: 84, height: 56, borderRadius: 8 },
  listTitle: { fontWeight: '700', color: colors.text },
  listSubtitle: { color: colors.textSecondary, marginTop: 4 },
  listPrice: { marginLeft: 12, color: colors.textSecondary },
});
