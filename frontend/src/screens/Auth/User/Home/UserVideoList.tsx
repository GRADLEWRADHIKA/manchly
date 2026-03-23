import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar as RNStatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { getCourseById } from '../../../../store/CourseSlice';
import YouTubePlayer from '../../../../components/YouTubePlayer';
import { Play, Clock } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { wp, hp, fp } from '../../../../utils/responsive';

const UserVideoList = () => {
  const route = useRoute();
  const data = route?.params?.item?.course;
  const [loading, setLoading] = useState(false);
  const [videoList, setVideoList] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  // Fetch videos for this course
  const getVideoById = (id: string) => {
    setLoading(true);
    dispatch(getCourseById(id))
      .unwrap()
      .then(response => {
        setVideoList(response?.course?.videos || []);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (data?.id) getVideoById(data?.id);
  }, [data?.id]);

  // Render each video card
  const renderVideoCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => setSelectedVideo(item)}
    >
      <View style={styles.thumbnailWrapper}>
        <Image source={{ uri: item?.thumbnail_url }} style={styles.thumbnail} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.thumbnailGradient}
        />
        <View style={styles.playIconContainer}>
          <View style={styles.playIcon}>
            <Play color={colors.white} size={wp(16)} fill={colors.white} />
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Clock color={colors.white} size={wp(10)} />
          <Text style={styles.durationBadgeText}>
            {item?.duration || 0}s
          </Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.videoTitle} numberOfLines={1}>{item?.title}</Text>
        <Text style={styles.videoDesc} numberOfLines={2}>
          {item?.description || 'No description available'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title={data?.title || 'Videos'} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : videoList.length > 0 ? (
        <FlatList
          data={videoList}
          renderItem={renderVideoCard}
          keyExtractor={(item, index) => item?.id || index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos available</Text>
        </View>
      )}

      {/* YouTube-style Video Player Modal */}
      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setSelectedVideo(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <RNStatusBar hidden={!!selectedVideo} />
          {selectedVideo && (
            <View style={styles.playerSection}>
              <YouTubePlayer
                source={{ uri: selectedVideo.playback_url }}
                title={selectedVideo.title}
                onClose={() => setSelectedVideo(null)}
                autoPlay
              />
            </View>
          )}
          {/* Video info below player */}
          {selectedVideo && (
            <View style={styles.videoInfoContainer}>
              <Text style={styles.videoInfoTitle}>{selectedVideo.title}</Text>
              <Text style={styles.videoInfoDesc}>
                {selectedVideo.description || 'No description available'}
              </Text>
              {/* Up next section */}
              {videoList.length > 1 && (
                <View style={styles.upNextSection}>
                  <Text style={styles.upNextTitle}>Up Next</Text>
                  <FlatList
                    data={videoList.filter(v => v.id !== selectedVideo.id)}
                    keyExtractor={(item, index) => item?.id || index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.upNextCard}
                        onPress={() => setSelectedVideo(item)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: item?.thumbnail_url }}
                          style={styles.upNextThumb}
                        />
                        <View style={styles.upNextInfo}>
                          <Text style={styles.upNextCardTitle} numberOfLines={2}>
                            {item?.title}
                          </Text>
                          <Text style={styles.upNextDuration}>
                            {item?.duration || 0}s
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default UserVideoList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: wp(16),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: wp(12),
    marginBottom: hp(14),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: wp(130),
    height: hp(90),
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: wp(12),
    borderBottomLeftRadius: wp(12),
    backgroundColor: colors.lightGrey,
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(40),
    borderBottomLeftRadius: wp(12),
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: hp(4),
    right: wp(4),
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderRadius: wp(4),
  },
  durationBadgeText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '600',
    marginLeft: wp(2),
  },
  cardContent: {
    flex: 1,
    padding: wp(10),
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.black,
    marginBottom: hp(4),
  },
  videoDesc: {
    fontSize: fp(12),
    color: '#555',
    lineHeight: fp(17),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fp(16),
    color: '#888',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerSection: {
    width: '100%',
    backgroundColor: '#000',
  },
  videoInfoContainer: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
  },
  videoInfoTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(6),
  },
  videoInfoDesc: {
    fontSize: fp(14),
    color: colors.textSecondary,
    lineHeight: fp(20),
    marginBottom: hp(16),
  },
  upNextSection: {
    flex: 1,
  },
  upNextTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(12),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: hp(12),
  },
  upNextCard: {
    flexDirection: 'row',
    marginBottom: hp(12),
    borderRadius: wp(8),
    overflow: 'hidden',
  },
  upNextThumb: {
    width: wp(120),
    height: hp(68),
    borderRadius: wp(8),
    backgroundColor: colors.lightGrey,
  },
  upNextInfo: {
    flex: 1,
    paddingLeft: wp(10),
    justifyContent: 'center',
  },
  upNextCardTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: hp(4),
  },
  upNextDuration: {
    fontSize: fp(12),
    color: colors.textSecondary,
  },
});
