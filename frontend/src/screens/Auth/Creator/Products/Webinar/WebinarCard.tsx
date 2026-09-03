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
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  Calendar,
  Clock,
  IndianRupee,
  Video,
  KeyRound,
  Copy,
  ChevronDown,
  Edit3,
  Trash2,
  Share2,
  Eye,
  MoreVertical,
} from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { generateShareLink } from '../../../../../services/AppsFlyerService';
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
  duration?: number;
  zoom_meeting_id?: string;
  zoom_password?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
  start_time?: string;
  end_time?: string;
  max_participants?: number;
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const zoomAnim = useRef(new Animated.Value(0)).current;
  const Nav = useNavigation<any>();

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => {
    setMenuVisible(false);
    setMenuKey(k => k + 1);
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
      position: 'top',
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

  const handleShare = async () => {
    const link = await generateShareLink({
      type: 'webinar',
      id: data?.id,
      title: data?.title || 'Webinar',
      description: 'Check out this webinar!',
      imageUrl: data?.thumbnail_url || '',
    });
    Share.share({ message: link });
  };

  const scheduledDate = moment(data.scheduled_at);
  const isUpcoming = scheduledDate.isAfter(moment());
  const day = scheduledDate.format('DD');
  const month = scheduledDate.format('MMM');
  const hasThumbnail = !!(data.thumbnail_url);

  return (
    <>
      <View style={styles.card}>
        {/* Top section */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => Nav.navigate('WebinarDetails', { data })}
        >
          {/* Thumbnail */}
          {hasThumbnail && (
            <View style={styles.thumbnailWrap}>
              <Image
                source={{ uri: data.thumbnail_url }}
                style={styles.thumbnail}
              />
              <View style={styles.thumbnailOverlay} />
              <View style={styles.thumbnailDateBlock}>
                <Text style={styles.thumbnailDateDay}>{day}</Text>
                <Text style={styles.thumbnailDateMonth}>{month}</Text>
              </View>
              <View style={styles.thumbnailPriceBadge}>
                <View style={styles.priceBadge}>
                  {data.price ? (
                    <IndianRupee size={wp(9)} color={colors.bg} strokeWidth={3} />
                  ) : null}
                  <Text style={styles.priceText}>
                    {data.price ? `${data.price}` : 'Free'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.thumbnailStatusBadge,
                  { backgroundColor: isUpcoming ? 'rgba(34,197,94,0.85)' : 'rgba(28,28,30,0.85)' },
                ]}
              >
                <Video size={wp(10)} color={colors.textPrimary} />
                <Text style={styles.thumbnailStatusText}>
                  {isUpcoming ? 'Upcoming' : 'Past'}
                </Text>
              </View>
            </View>
          )}

          <View style={hasThumbnail ? styles.touchableWithThumb : styles.touchable}>
          <View style={styles.topRow}>
            {/* Date block (only when no thumbnail) */}
            {!hasThumbnail && (
              <View style={styles.dateBlock}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
              </View>
            )}

            {/* Info */}
            <View style={styles.infoBlock}>
              <View style={styles.titleRow}>
                <Text numberOfLines={2} style={styles.title}>
                  {data?.title}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={wp(12)} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {data?.start_time || scheduledDate.format('h:mm A')}
                    {data?.end_time ? ` - ${data.end_time}` : ''}
                  </Text>
                </View>
                {data?.duration && (
                  <View style={styles.metaDot} />
                )}
                {data?.duration && (
                  <View style={styles.metaItem}>
                    <Video size={wp(12)} color={colors.textMuted} />
                    <Text style={styles.metaText}>{data.duration} min</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Price + Status row (only when no thumbnail) */}
          {!hasThumbnail && (
            <View style={styles.tagsStatusRow}>
              <View style={styles.priceBadge}>
                {data.price ? (
                  <IndianRupee size={wp(10)} color={colors.bg} strokeWidth={3} />
                ) : null}
                <Text style={styles.priceText}>
                  {data.price ? `${data.price}` : 'Free'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isUpcoming ? styles.statusUpcoming : styles.statusPast,
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: isUpcoming ? colors.creatorGreen : colors.textMuted }]} />
                <Text style={[styles.statusText, { color: isUpcoming ? colors.creatorGreen : colors.textMuted }]}>
                  {isUpcoming ? 'Upcoming' : 'Past'}
                </Text>
              </View>
            </View>
          )}

          {/* Zoom Details Toggle */}
          {data?.zoom_meeting_id && (
            <>
              <View style={styles.sectionDivider} />
              <TouchableOpacity
                style={styles.zoomToggle}
                onPress={toggleZoomDetails}
                activeOpacity={0.7}
              >
                <View style={styles.zoomToggleLeft}>
                  <KeyRound size={wp(14)} color={colors.gold} />
                  <Text style={styles.zoomToggleText}>Zoom Details</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: zoomRotate }] }}>
                  <ChevronDown size={wp(16)} color={colors.gold} />
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
                    <Copy size={wp(13)} color={colors.gold} />
                    <Text style={styles.copyBothText}>Copy ID & Password</Text>
                  </TouchableOpacity>
                  {data?.zoom_start_url && (
                    <TouchableOpacity
                      style={styles.startMeetingBtn}
                      activeOpacity={0.8}
                      onPress={() => Linking.openURL(data.zoom_start_url!)}
                    >
                      <Video size={wp(14)} color={colors.bg} />
                      <Text style={styles.startMeetingText}>Start Meeting</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
          </View>
        </TouchableOpacity>

        {/* 3-dot menu */}
        <View style={styles.menuAnchor}>
          <Menu
            key={menuKey}
            visible={menuVisible}
            onDismiss={closeMenu}
            contentStyle={styles.menuContent}
            anchor={
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={openMenu}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical size={wp(16)} color={'#888'} />
              </TouchableOpacity>
            }
          >
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(() => Nav.navigate('WebinarDetails', { data }), 350); }}>
              <Eye size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(() => Nav.navigate('CreateWebinar', { data }), 350); }}>
              <Edit3 size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(handleShare, 350); }}>
              <Share2 size={wp(16)} color={colors.success} />
              <Text style={[styles.menuItemText, { color: colors.success }]}>Share</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(() => setShowModal(true), 350); }}>
              <Trash2 size={wp(16)} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </Menu>
        </View>
      </View>

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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#161616',
  },
  touchable: {
    padding: wp(16),
  },
  touchableWithThumb: {
    paddingHorizontal: wp(14),
    paddingTop: hp(10),
    paddingBottom: wp(14),
  },

  // Thumbnail
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(140),
    backgroundColor: colors.inputBg,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  thumbnailDateBlock: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    width: wp(46),
    height: wp(50),
    borderRadius: wp(10),
    backgroundColor: 'rgba(15,15,15,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  thumbnailDateDay: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.gold,
    lineHeight: fp(22),
  },
  thumbnailDateMonth: {
    fontSize: fp(9),
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  thumbnailPriceBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
  },
  thumbnailStatusBadge: {
    position: 'absolute',
    bottom: hp(10),
    left: wp(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(10),
  },
  thumbnailStatusText: {
    color: colors.textPrimary,
    fontSize: fp(10),
    fontWeight: '700',
  },

  // Top row: date | info
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    width: wp(52),
    height: wp(56),
    borderRadius: wp(14),
    backgroundColor: 'rgba(240,192,64,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.15)',
  },
  dateDay: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.gold,
    lineHeight: fp(26),
  },
  dateMonth: {
    fontSize: fp(9),
    fontWeight: '700',
    color: 'rgba(240,192,64,0.7)',
    letterSpacing: 1.5,
    marginTop: hp(1),
  },
  infoBlock: {
    flex: 1,
  },
  titleRow: {
    marginBottom: hp(6),
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(20),
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2),
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  metaText: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    gap: wp(1),
    backgroundColor: colors.gold,
  },
  priceText: {
    color: colors.bg,
    fontSize: fp(12),
    fontWeight: '800',
  },

  // Price + Status row
  tagsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(14),
  },
  tagsWrap: {
    flexDirection: 'row',
    gap: wp(6),
    flex: 1,
  },
  tagPill: {
    backgroundColor: colors.goldDim,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  tagText: {
    fontSize: fp(9),
    color: colors.gold,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
  },
  statusUpcoming: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  statusPast: {
    backgroundColor: 'rgba(85,85,88,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(85,85,88,0.2)',
  },
  statusDot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
  },
  statusText: {
    fontSize: fp(10),
    fontWeight: '600',
  },

  // Divider
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: hp(14),
    marginBottom: hp(2),
    marginHorizontal: wp(-16),
  },

  // Zoom
  zoomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(8),
    paddingVertical: hp(6),
  },
  zoomToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  zoomToggleText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.gold,
  },
  zoomDetails: {
    marginTop: hp(4),
    backgroundColor: 'rgba(240,192,64,0.05)',
    borderRadius: wp(10),
    padding: wp(12),
    gap: hp(8),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.1)',
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
    fontSize: fp(9),
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  zoomValue: {
    fontSize: fp(13),
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: hp(2),
  },
  copyBothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingVertical: hp(8),
    borderRadius: wp(8),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.3)',
  },
  copyBothText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.gold,
  },
  startMeetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: colors.gold,
    paddingVertical: hp(10),
    borderRadius: wp(10),
    marginTop: hp(2),
  },
  startMeetingText: {
    color: colors.bg,
    fontSize: fp(12),
    fontWeight: '700',
  },

  // 3-dot menu
  menuAnchor: {
    position: 'absolute',
    top: hp(14),
    right: wp(12),
    zIndex: 100,
    elevation: 100,
  },
  moreBtn: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: hp(4),
    minWidth: wp(160),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
  },
  menuItemText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: wp(12),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});