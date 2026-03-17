import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { getCourseById } from '../../../../../store/CourseSlice';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Video from 'react-native-video';
import { Play, Clock, Pause, MoreVertical, Plus } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { Menu, FAB } from 'react-native-paper';
import Modal from 'react-native-modal';
import CourseAddVideoModal from './CourseAddVideoModal';
import { deleteVideo, updateVideo } from '../../../../../store/VideoSlice';
import DynamicModal from '../../../../../components/CommonModal';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const CourseVideoList = () => {
  const route = useRoute();
  const courseId = route?.params?.item?.id;
  const [videoList, setVideoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const videoRefs = useRef<{ [key: string]: any }>({});
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [videoId, setVideId] = useState('');
  const [videoData, setVideoData] = useState([]);
  const focus = useIsFocused();
  const [refresh, setRefresh] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false)

  const handleVideoPlay = (videoId: string) => {
    if (playingVideoId && playingVideoId !== videoId) {
      if (videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId].seek(0);
      }
    }

    setPlayingVideoId(playingVideoId === videoId ? null : videoId);
  };

  useEffect(() => {
    getVideoById();
  }, [focus, refresh]);

  const handleVideoEnd = () => {
    setPlayingVideoId(null);
  };

  const handleVideoError = (error: any) => {
    setPlayingVideoId(null);
  };

  const setVideoRef = (ref: any, videoId: string) => {
    videoRefs.current[videoId] = ref;
  };

  const handleMenuOpen = (videoId: string) => {
    setMenuVisible(videoId);
  };

  const handleMenuClose = () => {
    setMenuVisible(null);
    setShowModal(false);
  };

  // get course by id ----------
  const getVideoById = () => {
    setLoading(true);
    dispatch(getCourseById(courseId))
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

  // delete course video -----------
  const handleDelete = () => {
    setDeleteLoading(true);
    dispatch(deleteVideo(videoId))
      .unwrap()
      .then(response => {
        console.log('---resonse---', response);
        setDeleteLoading(false);
        setMenuVisible(null);
        getVideoById();
        setShowModal(false);
      })
      .catch(error => {
        console.log('----error---', error);
        setDeleteLoading(false);
      });
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const renderShimmerCard = () => (
    <View style={styles.shimmerCard}>
      <ShimmerPlaceholder
        style={styles.shimmerThumbnail}
        shimmerColors={[colors.lightGrey, colors.muted, colors.lightGrey]}
      />
      <View style={styles.shimmerContent}>
        <ShimmerPlaceholder
          style={styles.shimmerTitle}
          shimmerColors={[colors.lightGrey, colors.muted, colors.lightGrey]}
        />
        <ShimmerPlaceholder
          style={styles.shimmerDuration}
          shimmerColors={[colors.lightGrey, colors.muted, colors.lightGrey]}
        />
      </View>
    </View>
  );

  const renderVideoCard = ({ item }: any) => {
    const isPlaying = playingVideoId === item.id;
    const isMenuVisible = menuVisible === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.mediaContainer}>
          {isPlaying ? (
            <Video
              ref={ref => setVideoRef(ref, item.id)}
              source={{ uri: item.playback_url }}
              style={styles.videoPlayer}
              resizeMode="contain"
              controls={true}
              onEnd={handleVideoEnd}
              onError={handleVideoError}
              paused={!isPlaying}
              playWhenInactive={false}
              playInBackground={false}
              ignoreSilentSwitch="obey"
            />
          ) : (
            <TouchableOpacity
              style={styles.thumbnailContainer}
              onPress={() => handleVideoPlay(item.id)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    item?.thumbnail_url ||
                    'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
                }}
                style={styles.thumbnail}
                defaultSource={
                  item?.thumbnail_url ||
                  'https://cdn-icons-png.flaticon.com/512/4149/4149650.png'
                }
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={styles.thumbnailGradient}
              />
              <View style={styles.playButtonContainer}>
                <View style={styles.playButton}>
                  <Play color={colors.white} size={wp(20)} fill={colors.white} />
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Clock color={colors.white} size={wp(12)} />
                <Text style={styles.durationBadgeText}>
                  {item?.duration || 0}m
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {item?.title || 'Untitled Video'}
            </Text>
            <Menu
              visible={isMenuVisible}
              onDismiss={handleMenuClose}
              anchor={
                <TouchableOpacity
                  onPress={() => handleMenuOpen(item.id)}
                  style={styles.menuButton}
                >
                  <MoreVertical color={colors.textSecondary} size={wp(20)} />
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => {
                  setIsModalVisible(true);
                  setVideoData(item);
                  setMenuVisible(null);
                  setIsUpdate(true)
                }}
                title="Edit"
                style={styles.menuItem}
              />
              <Menu.Item
                onPress={() => {
                  setVideId(item?.id);
                  setShowModal(true);
                  setMenuVisible(null);
                }}
                title="Delete"
                titleStyle={styles.deleteText}
                style={styles.menuItem}
              />
            </Menu>
          </View>
          <View style={styles.metaInfo}>
            <Text style={styles.duration}>
              {item.description || 'Uncategorized'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Course Videos" />

      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          renderItem={renderShimmerCard}
          keyExtractor={item => item.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : videoList.length > 0 ? (
        <FlatList
          data={videoList}
          renderItem={renderVideoCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <View style={styles.noDataIcon}>
            <Play color={colors.primary} size={wp(48)} />
          </View>
          <Text style={styles.noDataTitle}>No Videos Available</Text>
          <Text style={styles.noDataSubtitle}>
            There are no videos added to this course yet.
          </Text>
        </View>
      )}

      <View style={{ marginRight: wp(10), marginBottom: hp(10) }}>
        <FAB
          icon={({ size, color }) => <Plus size={size} color={color} />}
          style={styles.fab}
          onPress={toggleModal}
          color={colors.white}
        />
      </View>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onSwipeComplete={toggleModal}
        swipeDirection={['down']}
        style={styles.modal}
      >
        <CourseAddVideoModal
          onClose={toggleModal}
          videoData={videoData}
          setRefresh={setRefresh}
          isUpdate={isUpdate}
        />
      </Modal>

      <DynamicModal
        visible={showModal}
        heading="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone and all course data will be lost."
        onCancel={handleMenuClose}
        onDelete={handleDelete}
        loading={deleteLoading}
      />
    </View>
  );
};

export default CourseVideoList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  listContainer: {
    paddingVertical: hp(8),
    paddingBottom: hp(20),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    marginHorizontal: wp(16),
    marginVertical: hp(6),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: wp(1),
    borderColor: colors.border,
  },
  mediaContainer: {
    position: 'relative',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(200),
    backgroundColor: colors.lightGrey,
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(60),
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: wp(50),
    height: hp(50),
    borderRadius: wp(25),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: wp(2),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: hp(12),
    right: wp(12),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: wp(12),
  },
  durationBadgeText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '600',
    marginLeft: wp(4),
  },
  videoPlayer: {
    width: '100%',
    height: hp(200),
    backgroundColor: colors.black,
  },
  content: {
    padding: wp(16),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(6),
  },
  title: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    lineHeight: fp(22),
    flex: 1,
    marginRight: wp(8),
  },
  menuButton: {
    padding: wp(4),
  },
  menuContent: {
    backgroundColor: colors.white,
    borderRadius: wp(8),
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: hp(8),
  },
  deleteText: {
    color: colors.error,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: fp(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGrey,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(8),
    alignSelf: 'flex-start',
  },
  pauseButtonText: {
    color: colors.primary,
    fontSize: fp(12),
    fontWeight: '600',
    marginLeft: wp(4),
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(40),
  },
  noDataIcon: {
    backgroundColor: colors.lightGrey,
    width: wp(100),
    height: hp(100),
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
    borderWidth: wp(1),
    borderColor: colors.border,
  },
  noDataTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: hp(8),
  },
  noDataSubtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
  },
  // Shimmer Styles
  shimmerCard: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    marginHorizontal: wp(16),
    marginVertical: hp(6),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: wp(1),
    borderColor: colors.border,
  },
  shimmerThumbnail: {
    width: '100%',
    height: hp(200),
  },
  shimmerContent: {
    padding: wp(16),
  },
  shimmerTitle: {
    width: '80%',
    height: hp(18),
    borderRadius: wp(4),
    marginBottom: hp(8),
  },
  shimmerDuration: {
    width: '40%',
    height: hp(14),
    borderRadius: wp(4),
  },
  // FAB Styles
  fab: {
    position: 'absolute',
    margin: wp(16),
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: wp(50),
  },
  // Modal Styles
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
