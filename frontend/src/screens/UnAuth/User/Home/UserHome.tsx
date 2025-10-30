import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { Users, Play } from 'lucide-react-native';
import AppHeader from '../../../../components/AppHeader';

const { width } = Dimensions.get('window');

const UserHome = () => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

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
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
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
              <Text style={styles.featuredInstructor}>by {item.instructor}</Text>
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
    </SafeAreaView>
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
});
