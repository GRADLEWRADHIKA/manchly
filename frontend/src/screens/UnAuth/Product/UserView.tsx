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
import { Users, Clock, Play, Search } from 'lucide-react-native';
import Video from 'react-native-video';
import colors from '../../../utils/colors';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

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
    title: 'Social Media Growth Strategy',
    instructor: 'Emma Brown',
    thumbnail:
      'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: '3.1K',
    duration: '3 hours',
    price: '$19',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
];

// 🧠 Example purchased courses
const purchasedCourses = [
  {
    id: 'p1',
    title: 'Advanced Instagram Marketing',
    instructor: 'Liam Carter',
    thumbnail:
      'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    students: '4.1K',
    duration: '5 hours',
    price: 'Purchased',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
];

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
  const { user } = useSelector((state: any) => state.userReducer);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  const renderCard = ({ item }: any) => {
    const isPlaying = playingVideoId === item.id;
    return (
      <View style={styles.card}>
        <VideoThumb
          id={item.id}
          videoUrl={item.videoUrl}
          thumbnailUrl={item.thumbnail}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onEnded={handleEnded}
        />

        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.instructor}>by {item.instructor}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.students}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{item.price}</Text>
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
            >
              <Text style={styles.primaryButtonText}>
                {item.price === 'Purchased' ? 'Continue' : 'Start Learning'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.outlineButton]}>
              <Text style={styles.outlineButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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

      {/* 🎓 Your Courses Section */}
      {purchasedCourses.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionHeading}>Your Courses</Text>
          <FlatList
            data={purchasedCourses}
            keyExtractor={i => i.id}
            renderItem={renderCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16 }}
          />
        </View>
      )}

      {/* 🎥 All Courses */}
      <Text style={styles.sectionHeading}>Browse Courses</Text>
      <FlatList
        data={userVideos}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        }
      />
    </ScrollView>
  );
};

export default UserView;

const styles = StyleSheet.create({
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
