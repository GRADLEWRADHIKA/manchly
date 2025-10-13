import React, { useState, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Users, Play, BookOpen, Award } from 'lucide-react-native';
import AppHeader from '../../../components/AppHeader';
import colors from '../../../utils/colors';
import Video from 'react-native-video';
import CreateWebinarModal from './CreateWebinar';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import KycCard from './KeyCard';

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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const [active, setActive] = useState(true);

  const featuredContent = [
    {
      id: 'f1',
      title: 'Digital Marketing Masterclass',
      instructor: 'Sarah Johnson',
      image:
        'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      students: '2.5K',
      rating: 4.8,
      duration: '4.5 hours',
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: 'f2',
      title: 'Content Creation Bootcamp',
      instructor: 'Mike Chen',
      image:
        'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      students: '1.8K',
      rating: 4.9,
      duration: '6 hours',
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
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
      title: 'SEO Advanced Tips — Part 2',
      date: 'Tomorrow 7PM',
      thumbnail:
        'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      videoUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  ];

  const upcomingWebinars = [
    {
      id: 'w1',
      title: 'Live Webinar: Future of Digital Marketing',
      date: 'Oct 5, 7PM',
      image:
        'https://images.pexels.com/photos/1181343/pexels-photo-1181343.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    },
    {
      id: 'w2',
      title: 'Live Webinar: AI in Content Creation',
      date: 'Oct 12, 5PM',
      image:
        'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    },
  ];

  const quickStats = [
    {
      label: 'Active Courses',
      value: '12',
      icon: <BookOpen size={24} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '5.2K',
      icon: <Users size={24} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '94%',
      icon: <Award size={24} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '₹12.5K',
      icon: <TrendingUp size={24} color={colors.golden} />,
    },
  ];

  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const handlePlay = (id: string) => setPlayingVideoId(id);
  const handleEnded = () => setPlayingVideoId(null);

  const renderFeaturedCard = (item: any) => {
    const isPlaying = playingVideoId === item.id;
    return (
      <View key={item.id} style={styles.featuredCard}>
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle}>{item.title}</Text>
          <Text style={styles.featuredInstructor}>by {item.instructor}</Text>
          <View style={styles.featuredStats}>
            <View style={styles.statBadge}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.students}</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeRight]}>
              <Play size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.duration}</Text>
            </View>
          </View>

          <VideoThumb
            id={item.id}
            videoUrl={item.videoUrl}
            thumbnailUrl={item.image}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onEnded={handleEnded}
            height={200}
          />
        </View>
      </View>
    );
  };

  const renderQuickStat = (stat: any, index: number) => (
    <View>
      <View key={index} style={styles.statCard}>
        <View style={styles.statIcon}>{stat.icon}</View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </View>
    </View>
  );

  const renderUpcomingVideo = ({ item }: any) => {
    const isPlaying = playingVideoId === item.id;
    return (
      <View style={styles.upcomingCard}>
        <Text style={styles.upcomingTitle}>{item.title}</Text>
        <Text style={styles.upcomingDate}>{item.date}</Text>

        <VideoThumb
          id={item.id}
          videoUrl={item.videoUrl}
          thumbnailUrl={item.thumbnail}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onEnded={handleEnded}
          height={120}
        />
      </View>
    );
  };

  const renderUpcomingWebinar = ({ item }: any) => (
    <View style={styles.upcomingCard}>
      <Image source={{ uri: item.image }} style={styles.upcomingImage} />
      <Text style={styles.upcomingTitle}>{item.title}</Text>
      <Text style={styles.upcomingDate}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" />
      <AppHeader title="Manchly" />

      {user?.user_type === 'CREATOR' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome back! 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              A Manch for every Creator...
            </Text>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              {active === true ? <KycCard /> : quickStats?.map(renderQuickStat)}
            </View>
          </View>

          {/* <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Content</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContent}
            >
              {featuredContent.map(renderFeaturedCard)}
            </ScrollView>
          </View> */}

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionCardRight]}
                onPress={() => {
                  navigation.navigate('CreateWebinar');
                }}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${colors.primary}20` },
                  ]}
                >
                  <Play size={24} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Start Live</Text>
                <Text style={styles.actionSubtitle}>Go live instantly</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  navigation.navigate('CreateCourse');
                }}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${colors.secondary}20` },
                  ]}
                >
                  <BookOpen size={24} color={colors.secondary} />
                </View>
                <Text style={styles.actionTitle}>Create Course</Text>
                <Text style={styles.actionSubtitle}>Build new content</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome 👋</Text>
            <Text style={styles.welcomeSubtitle}>Explore amazing content!</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Videos</Text>
            {featuredContent.map(renderFeaturedCard)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Videos</Text>
            <FlatList
              data={upcomingVideos}
              keyExtractor={item => item.id}
              renderItem={renderUpcomingVideo}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Webinars</Text>
            <FlatList
              data={upcomingWebinars}
              keyExtractor={item => item.id}
              renderItem={renderUpcomingWebinar}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },

  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  statIcon: { marginBottom: 8 },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  featuredSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  featuredScrollContent: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: width - 40,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 160,
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featuredInstructor: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  featuredStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statBadgeRight: {
    marginLeft: 12,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },

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

  actionsSection: { paddingHorizontal: 16, marginBottom: 24 },
  actionsGrid: { flexDirection: 'row' },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionCardRight: { marginRight: 12 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  upcomingCard: {
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginRight: 16,
    padding: 12,
  },
  upcomingImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  upcomingTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  upcomingDate: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
});

export default HomeScreen;
