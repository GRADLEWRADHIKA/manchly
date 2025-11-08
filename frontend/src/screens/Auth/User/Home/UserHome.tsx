import React, { memo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { Users, Play } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';
import Video from 'react-native-video';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

type VideoThumbProps = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onEnded?: () => void;
  height?: number;
};

const UserHome = () => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    const { token } = useSelector((state: any) => state.userReducer);


  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  const featuredContent = [
    {
      id: 'f1',
      title: 'Digital Marketing Masterclass',
      instructor: 'Sarah Johnson',
      image:
        'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      students: '2.5K',
      duration: '4.5 hours',
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
  ];

  const upcomingVideos = [
    {
      id: 'v1',
      title: 'SEO Advanced Tips — Part 1',
      date: 'Tomorrow 6PM',
      thumbnail:
        'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
     {
      id: 'v2',
      title: 'SEO Advanced Tips — Part 1',
      date: 'Tomorrow 6PM',
      thumbnail:
        'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  ];

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
        // Show thumbnail with a big play button overlay
        return (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPlay(id)}
            style={[styles.videoShell, { height }]}
          >
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.videoThumbImage}
            />
            <View style={styles.playOverlay}>
              <View style={styles.playCircle}>
                <Play size={28} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        );
      }

      // When playing, render the actual <Video />
      return (
        <View style={[styles.videoShell, { height }]}>
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <RNStatusBar barStyle="light-content" />
      <AppHeader title="Manchly" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome 👋</Text>
          <Text style={styles.welcomeSubtitle}>Explore amazing content!</Text>
        </View>

        <Text style={styles.sectionTitle}>Videos</Text>
        {featuredContent?.map(item => {
          const isPlaying = playingVideoId === item.id;
          return (
            <View key={item.id} style={styles.featuredCard}>
              <Text style={styles.featuredTitle}>{item.title}</Text>
              <Text style={styles.featuredInstructor}>
                by {item.instructor}
              </Text>
              <VideoThumb
                id={item.id}
                videoUrl={item.videoUrl}
                thumbnailUrl={item.image}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onEnded={handleEnded}
              />
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Upcoming Videos</Text>
        <FlatList
          data={upcomingVideos}
          horizontal
          renderItem={({ item }) => (
            <View style={styles.upcomingCard}>
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <Text style={styles.upcomingTitle}>{item.title}</Text>
              <Text style={styles.upcomingDate}>{item.date}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </ScrollView>
    </View>
  );
};

export default UserHome;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  welcomeSection: { padding: 16, alignItems: 'center' },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  welcomeSubtitle: { fontSize: 16, color: colors.textSecondary },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    padding: 16,
  },
  featuredCard: {
    width: width - 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  featuredTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  featuredInstructor: { color: colors.textSecondary, marginBottom: 8 },
  upcomingCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginRight: 16,
    padding: 10,
  },
  thumb: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  upcomingTitle: { fontWeight: '600', color: colors.text },
  upcomingDate: { color: colors.textSecondary, fontSize: 12 },
  videoShell: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 8,
  },
  videoThumbImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerFill: {
    width: '100%',
    height: '100%',
  },
});
