import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { getCourseById } from '../../../../../store/CourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import YouTubePlayer from '../../../../../components/YouTubePlayer';
import { Play, Clock, Plus, MoreVertical, Upload, CheckCircle, AlertCircle } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { Menu, FAB } from 'react-native-paper';
import ModalBottom from 'react-native-modal';
import CourseAddVideoModal from './CourseAddVideoModal';
import { deleteVideo, ActiveUpload } from '../../../../../store/VideoSlice';
import DynamicModal from '../../../../../components/CommonModal';
import { RootState } from '../../../../../store/Store';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const SCREEN_BG = 'rgba(0,0,0,0.75)';
const CARD_BG = '#141414';
const VIDEO_CARD_BG = '#1C1B1B';
const ACCENT = '#D5C4AB';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_MUTED = 'rgba(255,255,255,0.5)';
const SHIMMER_COLORS = ['#1E1E1E', '#2A2A2A', '#1E1E1E'];

const formatDuration = (durationInSeconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(Number(durationInSeconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

const CourseVideoList = () => {
  const route = useRoute();
  const courseId = route?.params?.item?.id;
  const [videoList, setVideoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [videoId, setVideId] = useState('');
  const [videoData, setVideoData] = useState([]);
  const focus = useIsFocused();
  const [refresh, setRefresh] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const activeUploads = useSelector(
    (state: RootState) => state.videosReducer.activeUploads,
  ).filter((u: ActiveUpload) => u.courseId === courseId);

  useEffect(() => {
    getVideoById();
  }, [focus, refresh]);

  const getVideoById = () => {
    setLoading(true);
    dispatch(getCourseById(courseId))
      .unwrap()
      .then(response => {
        setVideoList(response?.course?.videos || []);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
      });
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    dispatch(deleteVideo(videoId))
      .unwrap()
      .then(response => {
        setDeleteLoading(false);
        setMenuVisible(null);
        getVideoById();
        setShowModal(false);
      })
      .catch(error => {
        setDeleteLoading(false);
      });
  };

  const handleMenuClose = () => {
    setMenuVisible(null);
    setShowModal(false);
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const renderUploadCard = (item: ActiveUpload) => {
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed';

    return (
      <View key={item.uploadId} style={styles.uploadCard}>
        <View style={styles.uploadIconContainer}>
          {isCompleted ? (
            <CheckCircle color={colors.success} size={wp(24)} />
          ) : isFailed ? (
            <AlertCircle color={colors.error} size={wp(24)} />
          ) : (
            <Upload color={colors.gold} size={wp(24)} />
          )}
        </View>
        <View style={styles.uploadInfo}>
          <Text style={styles.uploadTitle} numberOfLines={1}>
            {item.videoTitle}
          </Text>
          <Text
            style={[
              styles.uploadStatus,
              isCompleted && { color: colors.success },
              isFailed && { color: colors.error },
            ]}>
            {isCompleted
              ? 'Upload complete'
              : isFailed
              ? item.error || 'Upload failed'
              : `Uploading... ${item.progress}%`}
          </Text>
          {item.status === 'uploading' && (
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${item.progress}%` }]}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderShimmerCard = () => (
    <View style={styles.shimmerCard}>
      <ShimmerPlaceholder
        style={styles.shimmerThumbnail}
        shimmerColors={SHIMMER_COLORS}
      />
      <View style={styles.shimmerContent}>
        <ShimmerPlaceholder
          style={styles.shimmerTitle}
          shimmerColors={SHIMMER_COLORS}
        />
        <ShimmerPlaceholder
          style={styles.shimmerDuration}
          shimmerColors={SHIMMER_COLORS}
        />
      </View>
    </View>
  );

  const renderVideoCard = ({ item }: any) => {
    const isMenuVisible = menuVisible === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => setSelectedVideo(item)}
      >
        <View style={styles.thumbnailWrapper}>
          <Image
            source={{
              uri:
                item?.thumbnail_url ||
                'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
            }}
            style={styles.thumbnail}
          />
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
              {formatDuration(item?.duration)}
            </Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {item?.title || 'Untitled Video'}
            </Text>
            <Menu
              visible={isMenuVisible}
              onDismiss={handleMenuClose}
              anchor={
                <TouchableOpacity
                  onPress={e => {
                    e.stopPropagation?.();
                    setMenuVisible(item.id);
                  }}
                  style={styles.menuButton}
                >
                  <MoreVertical color={'rgba(255,255,255,0.5)'} size={wp(18)} />
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => {
                  setIsModalVisible(true);
                  setVideoData(item);
                  setMenuVisible(null);
                  setIsUpdate(true);
                }}
                title="Edit"
                titleStyle={styles.editText}
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
          <Text style={styles.videoDesc} numberOfLines={2}>
            {item?.description || 'No description available'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Course Videos" bgColor="transparent" />

      {activeUploads.length > 0 && (
        <View style={styles.uploadsSection}>
          {activeUploads.map(renderUploadCard)}
        </View>
      )}

      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Total Videos: {videoList.length}
          </Text>
        </View>
      )}

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
            <Play color={colors.gold} size={wp(48)} />
          </View>
          <Text style={styles.noDataTitle}>No Videos Available</Text>
          <Text style={styles.noDataSubtitle}>
            There are no videos added to this course yet.
          </Text>
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
          {selectedVideo && (
            <View style={styles.videoInfoContainer}>
              <Text style={styles.videoInfoTitle}>{selectedVideo.title}</Text>
              <Text style={styles.videoInfoDesc}>
                {selectedVideo.description || 'No description available'}
              </Text>
              {videoList.length > 1 && (
                <View style={styles.upNextSection}>
                  <Text style={styles.upNextTitle}>Up Next</Text>
                  <FlatList
                    data={videoList.filter(v => v.id !== selectedVideo.id)}
                    keyExtractor={(item, index) =>
                      item?.id || index.toString()
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.upNextCard}
                        onPress={() => setSelectedVideo(item)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{
                            uri:
                              item?.thumbnail_url ||
                              'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
                          }}
                          style={styles.upNextThumb}
                        />
                        <View style={styles.upNextInfo}>
                          <Text
                            style={styles.upNextCardTitle}
                            numberOfLines={2}
                          >
                            {item?.title}
                          </Text>
                          <Text style={styles.upNextDuration}>
                            {formatDuration(item?.duration)}
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

      <View style={{ marginRight: wp(10), marginBottom: hp(10) }}>
        <FAB
          icon={({ size, color }) => <Plus size={size} color={color} />}
          style={styles.fab}
          onPress={toggleModal}
          color={colors.black}
        />
      </View>

      <ModalBottom
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        onSwipeComplete={toggleModal}
        swipeDirection={['down']}
        style={styles.bottomModal}
      >
        <CourseAddVideoModal
          onClose={toggleModal}
          videoData={videoData}
          setRefresh={setRefresh}
          isUpdate={isUpdate}
          setIsModalVisible={setIsModalVisible}
        />
      </ModalBottom>

      <DynamicModal
        visible={showModal}
        heading="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
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
    backgroundColor: SCREEN_BG,
    flex: 1,
  },
  listContainer: {
    padding: wp(16),
    paddingBottom: hp(20),
  },
  countRow: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
  },
  countText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Video card - horizontal layout like user page
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VIDEO_CARD_BG,
    borderRadius: wp(20),
    marginBottom: hp(14),
    padding: wp(14),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: wp(84),
    height: wp(84),
    borderRadius: wp(16),
    borderWidth: 1.5,
    borderColor: ACCENT,
    overflow: 'hidden',
    marginRight: wp(14),
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#242220',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(30),
  },
  playIconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    backgroundColor: colors.golden,
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
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
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    marginRight: wp(4),
  },
  videoDesc: {
    fontSize: fp(12),
    color: TEXT_SECONDARY,
    lineHeight: fp(17),
    marginTop: hp(4),
  },
  menuButton: {
    padding: wp(4),
  },
  menuContent: {
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderRadius: wp(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuItem: {
    paddingVertical: hp(8),
  },
  editText: {
    color: '#D5C4AB',
  },
  deleteText: {
    color: colors.error,
  },
  // YouTube-style modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  playerSection: {
    width: '100%',
    backgroundColor: colors.black,
  },
  videoInfoContainer: {
    flex: 1,
    backgroundColor: '#404040',
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
  },
  videoInfoTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  videoInfoDesc: {
    fontSize: fp(14),
    color: TEXT_SECONDARY,
    lineHeight: fp(20),
    marginBottom: hp(16),
  },
  upNextSection: {
    flex: 1,
  },
  upNextTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.gold,
    marginBottom: hp(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#242220',
    borderWidth: 1,
    borderColor: 'rgba(213,196,171,0.35)',
  },
  upNextInfo: {
    flex: 1,
    paddingLeft: wp(10),
    justifyContent: 'center',
  },
  upNextCardTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: hp(4),
  },
  upNextDuration: {
    fontSize: fp(12),
    color: TEXT_MUTED,
  },
  // Empty state
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(40),
  },
  noDataIcon: {
    backgroundColor: CARD_BG,
    width: wp(100),
    height: hp(100),
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
    borderWidth: wp(1),
    borderColor: 'rgba(240,192,64,0.4)',
  },
  noDataTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: hp(8),
  },
  noDataSubtitle: {
    fontSize: fp(14),
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: fp(20),
  },
  // Shimmer
  shimmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VIDEO_CARD_BG,
    borderRadius: wp(20),
    marginHorizontal: wp(16),
    marginVertical: hp(6),
    padding: wp(14),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shimmerThumbnail: {
    width: wp(84),
    height: wp(84),
    borderRadius: wp(16),
  },
  shimmerContent: {
    flex: 1,
    paddingLeft: wp(14),
    justifyContent: 'center',
  },
  shimmerTitle: {
    width: '80%',
    height: hp(16),
    borderRadius: wp(4),
    marginBottom: hp(8),
  },
  shimmerDuration: {
    width: '40%',
    height: hp(12),
    borderRadius: wp(4),
  },
  // Upload indicators
  uploadsSection: {
    paddingHorizontal: wp(16),
    paddingTop: hp(10),
  },
  uploadCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: CARD_BG,
    borderRadius: wp(10),
    padding: wp(12),
    marginBottom: hp(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  uploadIconContainer: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: wp(12),
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: fp(14),
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: hp(2),
  },
  uploadStatus: {
    fontSize: fp(12),
    color: colors.gold,
    marginBottom: hp(4),
  },
  progressBarBg: {
    height: hp(4),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(2),
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%' as const,
    backgroundColor: '#D69C40',
    borderRadius: wp(2),
  },
  // FAB
  fab: {
    position: 'absolute',
    margin: wp(16),
    right: 0,
    bottom: 0,
    backgroundColor: '#D69C40',
    borderRadius: wp(50),
  },
  // Bottom modal
  bottomModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
});
