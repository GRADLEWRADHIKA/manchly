import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import React, { useRef, useState } from 'react';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import moment from 'moment-timezone';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  EllipsisVertical,
  Calendar,
  IndianRupee,
  Users,
  Video,
  KeyRound,
  Copy,
  ChevronDown,
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [webinarId, setWebinarId] = useState<string>('');
  const [showZoomDetails, setShowZoomDetails] = useState(false);
  const zoomAnim = useRef(new Animated.Value(0)).current;

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
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef<View>(null);
  const Nav = useNavigation<any>();

  const handleMenuToggle = () => {
    if (!menuVisible) {
      menuBtnRef.current?.measureInWindow((x, y, width, height) => {
        setMenuPos({ top: y + height + hp(4), right: wp(16) });
        setMenuVisible(true);
      });
    } else {
      setMenuVisible(false);
    }
  };
  const handleMenuClose = () => setMenuVisible(false);
  const handleCancel = () => setShowModal(false);

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
    dispatch(deleteWebinar(webinarId as any))
      .unwrap()
      .then(() => {
        setRefreshWebinar?.(true);
        setDeleteLoader(false);
        setShowModal(false);
      })
      .catch(() => setDeleteLoader(false));
  };

  const isUpcoming = moment(data.scheduled_at).isAfter(moment());
  const scheduledDate = moment(data.scheduled_at);

  return (
    <>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.thumbnailWrap}
          activeOpacity={0.9}
          onPress={() => {
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
          }}
        >
          <Image
            source={{
              uri:
                data.thumbnail_url ||
                'https://via.placeholder.com/300x200.png?text=Webinar',
            }}
            style={styles.thumbnail}
          />

          <View style={styles.thumbnailOverlay} />

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isUpcoming
                  ? colors.success + 'DD'
                  : colors.textSecondary + 'DD',
              },
            ]}
          >
            <Video size={wp(10)} color={colors.white} />
            <Text style={styles.statusText}>
              {isUpcoming ? 'Upcoming' : 'Past'}
            </Text>
          </View>

          <View style={styles.priceBadge}>
            <IndianRupee size={wp(12)} color={colors.white} />
            <Text style={styles.priceText}>{data.price}</Text>
          </View>
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuWrap} ref={menuBtnRef}>
          <TouchableOpacity
            onPress={handleMenuToggle}
            style={styles.menuButton}
          >
            <EllipsisVertical color={colors.white} size={wp(18)} />
          </TouchableOpacity>
        </View>

        {menuVisible && (
          <Modal
            transparent
            animationType="fade"
            visible={menuVisible}
            onRequestClose={handleMenuClose}
          >
            <Pressable style={styles.menuOverlay} onPress={handleMenuClose}>
              <View style={[styles.menuDropdown, { top: menuPos.top, right: menuPos.right }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleMenuClose();
                    Nav.navigate('CreateWebinar', { data: data });
                  }}
                >
                  <Text style={styles.menuItemText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleMenuClose();
                    setShowModal(true);
                    setWebinarId(data?.id);
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {data?.title}
          </Text>

          {data?.tags && data.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {data.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View style={styles.creatorRow}>
              {(data?.creator?.profile_image || data?.profile_image) ? (
                <Image
                  source={{
                    uri: data?.creator?.profile_image || data?.profile_image,
                  }}
                  style={styles.creatorImg}
                />
              ) : (
                <View style={styles.creatorImgFallback}>
                  <Users size={wp(12)} color={colors.muted} />
                </View>
              )}
              <Text style={styles.creatorName} numberOfLines={1}>
                {data?.creator?.name || data?.name || 'Creator'}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Calendar size={wp(12)} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {scheduledDate.format('DD MMM, YY')}
              </Text>
            </View>
          </View>

          {data?.zoom_meeting_id && (
            <>
              <TouchableOpacity
                style={styles.zoomToggle}
                onPress={toggleZoomDetails}
                activeOpacity={0.7}
              >
                <View style={styles.zoomToggleLeft}>
                  <KeyRound size={wp(14)} color={colors.info} />
                  <Text style={styles.zoomToggleText}>Zoom Details</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: zoomRotate }] }}>
                  <ChevronDown size={wp(16)} color={colors.textSecondary} />
                </Animated.View>
              </TouchableOpacity>

              {showZoomDetails && (
                <View style={styles.zoomDetails}>
                  <View style={styles.zoomRow}>
                    <View style={styles.zoomInfo}>
                      <Text style={styles.zoomLabel}>Meeting ID</Text>
                      <Text style={styles.zoomValue}>{data.zoom_meeting_id}</Text>
                    </View>
                  </View>

                  {data?.zoom_password && (
                    <View style={styles.zoomRow}>
                      <View style={styles.zoomInfo}>
                        <Text style={styles.zoomLabel}>Password</Text>
                        <Text style={styles.zoomValue}>{data.zoom_password}</Text>
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
                    <Copy size={wp(14)} color={colors.info} />
                    <Text style={styles.copyBothText}>Copy ID & Password</Text>
                  </TouchableOpacity>

                  {data?.zoom_start_url && (
                    <TouchableOpacity
                      style={styles.startMeetingBtn}
                      activeOpacity={0.8}
                      onPress={() => Linking.openURL(data.zoom_start_url!)}
                    >
                      <Video size={wp(16)} color={colors.white} />
                      <Text style={styles.startMeetingText}>Start Meeting</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <DynamicModal
        visible={showModal}
        heading="Delete Webinar"
        message="Are you sure you want to delete this webinar?"
        onCancel={handleCancel}
        onDelete={handleDelete}
        loading={deleteLoader}
      />
    </>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: wp(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: hp(12),
  },

  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(160),
    backgroundColor: colors.placeholder,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  statusBadge: {
    position: 'absolute',
    top: wp(10),
    left: wp(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  statusText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },
  priceBadge: {
    position: 'absolute',
    bottom: wp(10),
    left: wp(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + 'CC',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(10),
    gap: wp(2),
  },
  priceText: {
    color: colors.white,
    fontSize: fp(14),
    fontWeight: '800',
  },
  menuWrap: {
    position: 'absolute',
    top: wp(8),
    right: wp(8),
  },
  menuButton: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
  },
  menuDropdown: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingVertical: hp(4),
    width: wp(140),
    elevation: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  menuItem: {
    paddingVertical: hp(12),
    paddingHorizontal: wp(18),
  },
  menuItemText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.surface,
  },
  deleteText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.error,
  },

  // Content
  content: {
    padding: wp(14),
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    lineHeight: fp(21),
  },

  // Tags
  tagContainer: {
    flexDirection: 'row',
    marginTop: hp(6),
    gap: wp(6),
  },
  tagPill: {
    backgroundColor: colors.info + '12',
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(20),
    borderWidth: 1,
    borderColor: colors.info + '25',
  },
  tagText: {
    fontSize: fp(11),
    color: colors.info,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: hp(8),
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorImg: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: colors.placeholder,
  },
  creatorImgFallback: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorName: {
    marginLeft: wp(6),
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  dateText: {
    fontSize: fp(11),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Zoom Details
  zoomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(8),
    paddingVertical: hp(8),
    paddingHorizontal: wp(10),
    backgroundColor: colors.info + '0A',
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  zoomToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  zoomToggleText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.info,
  },
  zoomDetails: {
    marginTop: hp(8),
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    fontWeight: '500',
  },
  zoomValue: {
    fontSize: fp(13),
    color: colors.text,
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
    backgroundColor: colors.info + '15',
    borderWidth: 1,
    borderColor: colors.info + '25',
  },
  copyBothText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.info,
  },
  startMeetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: colors.primary,
    paddingVertical: hp(9),
    borderRadius: wp(10),
    marginTop: hp(2),
  },
  startMeetingText: {
    color: colors.white,
    fontSize: fp(13),
    fontWeight: '700',
  },
});
