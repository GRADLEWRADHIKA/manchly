import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  Linking,
  LayoutAnimation,
  UIManager,
  Platform,
  Share,
} from 'react-native';
import React, { useRef, useState } from 'react';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import moment from 'moment-timezone';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  Calendar,
  IndianRupee,
  Video,
  KeyRound,
  Copy,
  ChevronDown,
  Edit3,
  Trash2,
  Share2,
  Eye,
} from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import DynamicModal from '../../../../../components/CommonModal';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { deleteWebinar } from '../../../../../store/WebinarSlice';
import { useNavigation } from '@react-navigation/native';

interface WebinarData {
  id: string;
  title: string;
  thumbnail_url?: string;
  tags?: string[];
  creator?: {
    name?: string;
    profile_image?: string;
  };
  name?: string;
  profile_image?: string;
  price: number;
  scheduled_at: string | Date;
  zoom_meeting_id?: string;
  zoom_password?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
}

interface WebinarCardProps {
  data: WebinarData;
  setRefreshWebinar?: (val: boolean) => void;
}

const WebinarCard: React.FC<WebinarCardProps> = ({
  data,
  setRefreshWebinar,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [showZoomDetails, setShowZoomDetails] = useState(false);
  const zoomAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const Nav = useNavigation<any>();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const toggleZoomDetails = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const opening = !showZoomDetails;
    setShowZoomDetails(opening);
    Animated.spring(zoomAnim, {
      toValue: opening ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  };

  const zoomRotate = zoomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Toast.show({
      type: 'success',
      text1: `${label} copied!`,
      position: 'bottom',
      visibilityTime: 1500,
    });
  };

  const handleDelete = () => {
    setDeleteLoader(true);
    dispatch(deleteWebinar(data.id as any))
      .unwrap()
      .then(() => {
        setRefreshWebinar?.(true);
        setDeleteLoader(false);
        setShowModal(false);
      })
      .catch(() => setDeleteLoader(false));
  };

  const handleShare = () => {
    Share.share({
      message: `https://manchly.chottu.link/webinar/${data?.id}`,
    });
  };

  const handleJoinZoom = () => {
    const meetingId = data?.zoom_meeting_id;
    const password = data?.zoom_password;

    if (meetingId && password) {
      const zoomURL = `zoomus://zoom.us/join?confno=${meetingId}&pwd=${password}`;
      Linking.openURL(zoomURL).catch(() => {
        if (data?.zoom_join_url) {
          Linking.openURL(data.zoom_join_url);
        }
      });
    }
  };

  const scheduledDate = moment(data.scheduled_at);
  const isUpcoming = moment(data.scheduled_at).isAfter(moment());

  return (
    <>
      <Animated.View
        style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
      >
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleJoinZoom}
            style={styles.touchable}
          >
            {/* Thumbnail */}
            <View style={styles.thumbnailWrap}>
              <Image
                source={{
                  uri:
                    data.thumbnail_url ||
                    'https://via.placeholder.com/300x200.png?text=Webinar',
                }}
                style={styles.thumbnail}
              />
              <View style={styles.thumbnailOverlay} />

              {/* Price badge */}
              <LinearGradient
                colors={
                  data.price
                    ? ['#F97316', '#FB923C']
                    : ['#10B981', '#34D399']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.priceBadge}
              >
                {data.price ? (
                  <IndianRupee
                    size={wp(10)}
                    color={colors.white}
                    strokeWidth={3}
                  />
                ) : null}
                <Text style={styles.priceText}>
                  {data.price ? `${data.price}` : 'Free'}
                </Text>
              </LinearGradient>

              {/* Status badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isUpcoming
                      ? 'rgba(16,185,129,0.85)'
                      : 'rgba(26,26,46,0.85)',
                    borderColor: isUpcoming
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(255,255,255,0.15)',
                  },
                ]}
              >
                <Video size={wp(10)} color={colors.white} />
                <Text style={styles.statusText}>
                  {isUpcoming ? 'Upcoming' : 'Past'}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Tags */}
              {data?.tags && data.tags.length > 0 && (
                <View style={styles.tagContainer}>
                  {data.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.tagPill}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Title */}
              <Text numberOfLines={2} style={styles.title}>
                {data?.title}
              </Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Calendar size={wp(13)} color={'#60A5FA'} />
                  <Text style={styles.statText}>
                    {scheduledDate.format('DD MMM, YY • h:mm A')}
                  </Text>
                </View>
              </View>

              {/* Zoom Details Toggle */}
              {data?.zoom_meeting_id && (
                <>
                  <TouchableOpacity
                    style={styles.zoomToggle}
                    onPress={toggleZoomDetails}
                    activeOpacity={0.7}
                  >
                    <View style={styles.zoomToggleLeft}>
                      <KeyRound size={wp(14)} color={'#60A5FA'} />
                      <Text style={styles.zoomToggleText}>Zoom Details</Text>
                    </View>
                    <Animated.View
                      style={{ transform: [{ rotate: zoomRotate }] }}
                    >
                      <ChevronDown size={wp(16)} color={'#60A5FA'} />
                    </Animated.View>
                  </TouchableOpacity>

                  {showZoomDetails && (
                    <View style={styles.zoomDetails}>
                      <View style={styles.zoomRow}>
                        <View style={styles.zoomInfo}>
                          <Text style={styles.zoomLabel}>Meeting ID</Text>
                          <Text style={styles.zoomValue}>
                            {data.zoom_meeting_id}
                          </Text>
                        </View>
                      </View>

                      {data?.zoom_password && (
                        <View style={styles.zoomRow}>
                          <View style={styles.zoomInfo}>
                            <Text style={styles.zoomLabel}>Password</Text>
                            <Text style={styles.zoomValue}>
                              {data.zoom_password}
                            </Text>
                          </View>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.copyBothBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          const text = `Meeting ID: ${data.zoom_meeting_id}\nPassword: ${data.zoom_password || ''}`;
                          copyToClipboard(text, 'Meeting ID & Password');
                        }}
                      >
                        <Copy size={wp(14)} color={'#60A5FA'} />
                        <Text style={styles.copyBothText}>
                          Copy ID & Password
                        </Text>
                      </TouchableOpacity>

                      {data?.zoom_start_url && (
                        <TouchableOpacity
                          style={styles.startMeetingBtn}
                          activeOpacity={0.8}
                          onPress={() => Linking.openURL(data.zoom_start_url!)}
                        >
                          <Video size={wp(14)} color={colors.white} />
                          <Text style={styles.startMeetingText}>
                            Start Meeting
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Nav.navigate('WebinarDetails', { data })}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: 'rgba(242, 255, 0, 0.16)' },
                  ]}
                >
                  <Eye size={wp(14)} color={'#ebfc00'} />
                </View>
                <Text style={[styles.actionText, { color: '#ebfc00' }]}>
                  Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Nav.navigate('CreateWebinar', { data: data })}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconWrap}>
                  <Edit3 size={wp(14)} color={'#60A5FA'} />
                </View>
                <Text style={[styles.actionText, { color: '#60A5FA' }]}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: 'rgba(16,185,129,0.15)' },
                  ]}
                >
                  <Share2 size={wp(14)} color={'#10B981'} />
                </View>
                <Text style={[styles.actionText, { color: '#10B981' }]}>
                  Share
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowModal(true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: 'rgba(239,68,68,0.15)' },
                  ]}
                >
                  <Trash2 size={wp(14)} color={colors.error} />
                </View>
                <Text style={[styles.actionText, { color: colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <DynamicModal
        visible={showModal}
        heading="Delete Webinar"
        message="Are you sure you want to delete this webinar?"
        onCancel={() => setShowModal(false)}
        onDelete={handleDelete}
        loading={deleteLoader}
      />
    </>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: wp(16),
    marginBottom: hp(14),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0F3460',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  gradient: {
    flex: 1,
    borderRadius: wp(16),
  },
  touchable: {
    flex: 1,
  },

  // Thumbnail
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(160),
    backgroundColor: '#0D1B2A',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,52,96,0.3)',
  },
  priceBadge: {
    position: 'absolute',
    top: hp(12),
    right: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    gap: wp(2),
  },
  priceText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '800',
  },
  statusBadge: {
    position: 'absolute',
    bottom: hp(12),
    left: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(12),
    borderWidth: 1,
  },
  statusText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },

  // Content
  content: {
    padding: wp(12),
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: hp(5),
    gap: wp(6),
  },
  tagPill: {
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
  },
  tagText: {
    fontSize: fp(9),
    color: '#60A5FA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fp(14),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(19),
    marginBottom: hp(8),
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  statText: {
    color: '#94A3B8',
    fontSize: fp(10),
    fontWeight: '600',
  },

  // Zoom Details
  zoomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(8),
    paddingVertical: hp(8),
    paddingHorizontal: wp(10),
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  zoomToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  zoomToggleText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: '#60A5FA',
  },
  zoomDetails: {
    marginTop: hp(8),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: wp(10),
    padding: wp(10),
    gap: hp(8),
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoomInfo: {
    flex: 1,
  },
  zoomLabel: {
    fontSize: fp(10),
    color: '#94A3B8',
    fontWeight: '500',
  },
  zoomValue: {
    fontSize: fp(13),
    color: colors.white,
    fontWeight: '700',
    marginTop: hp(1),
  },
  copyBothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingVertical: hp(8),
    borderRadius: wp(8),
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
  },
  copyBothText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: '#60A5FA',
  },
  startMeetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: 'rgba(96,165,250,0.2)',
    paddingVertical: hp(9),
    borderRadius: wp(10),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  startMeetingText: {
    color: colors.white,
    fontSize: fp(13),
    fontWeight: '700',
  },

  // Separator
  separator: {
    height: 1,
    marginHorizontal: wp(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    paddingVertical: hp(6),
    paddingHorizontal: wp(6),
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(3),
    paddingVertical: hp(3),
  },
  actionIconWrap: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(96,165,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
});
