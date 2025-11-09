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
} from 'react-native';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { getCourseById } from '../../../../store/CourseSlice';
import Video from 'react-native-video';
import { X } from 'lucide-react-native';

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
        console.log('----error---', error);
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
      <Image source={{ uri: item?.thumbnail_url }} style={styles.thumbnail} />
      <View style={styles.cardContent}>
        <Text style={styles.videoTitle}>{item?.title}</Text>
        <Text style={styles.videoDesc} numberOfLines={2}>
          {item?.description || 'No description available'}
        </Text>
        <Text style={styles.duration}>⏱ {item?.duration || 0} sec</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.primary} />
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

      {/* Video Player Modal */}
      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.videoContainer}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedVideo(null)}
            >
              <X size={28} color={colors.white} />
            </TouchableOpacity>

            {selectedVideo && (
              <Video
                source={{ uri: selectedVideo.playback_url }}
                style={styles.videoPlayer}
                controls
                resizeMode="contain"
                paused={false}
              />
            )}
          </View>
        </View>
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
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  videoDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  duration: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '60%',
    backgroundColor: 'black',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
