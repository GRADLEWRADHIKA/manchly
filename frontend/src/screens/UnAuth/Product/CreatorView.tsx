import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Users, Clock, Play } from 'lucide-react-native';
import Video from 'react-native-video';
import colors from '../../../utils/colors';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

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
  },
];

const VideoThumb = memo(({ id, videoUrl, thumbnailUrl, isPlaying, onPlay, onEnded }: any) => {
  if (!isPlaying) {
    return (
      <TouchableOpacity onPress={() => onPlay(id)} activeOpacity={0.9} style={styles.videoShell}>
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
});

const CreatorView: React.FC = () => {
  const Nav = useNavigation<any>();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  const renderCourseCard = ({ item }: any) => {
    const isPlaying = playingVideoId === item.id;
    return (
      <View style={styles.courseCard}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseInstructor}>by {item.instructor}</Text>

        <VideoThumb
          id={item.id}
          videoUrl={item.videoUrl}
          thumbnailUrl={item.thumbnail}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onEnded={handleEnded}
        />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.students}</Text>
          </View>
          <View style={[styles.metaItem, { marginLeft: 12 }]}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.duration}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            // onPress={() => Nav.navigate('EditCourse', { courseId: item.id })}
          >
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            // onPress={() => Nav.navigate('Analytics', { courseId: item.id })}
          >
            <Text style={[styles.btnText, styles.btnOutlineText]}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.heroSection}>
        <Text style={styles.heroHeading}>Welcome back, Creator 👋</Text>
        <Text style={styles.heroSub}>Manage your courses and performance</Text>
      </View>

      <FlatList
        data={creatorCourses}
        keyExtractor={(i) => i.id}
        renderItem={renderCourseCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
    </ScrollView>
  );
};

export default CreatorView;

const styles = StyleSheet.create({
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

  heroSection: { padding: 16 },
  heroHeading: { fontSize: 22, fontWeight: '700', color: colors.text },
  heroSub: { color: colors.textSecondary, marginTop: 6 },
  courseCard: {
    width: width - 60,
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 5,
    padding: 12,
  },
  courseTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  courseInstructor: { color: colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 6, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary, marginRight: 8 },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#fff', fontWeight: '700' },
  btnOutlineText: { color: colors.text },
});
