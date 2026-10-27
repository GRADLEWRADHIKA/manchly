import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Pressable,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import moment from 'moment-timezone';
import { Menu } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import colors from '../../../../../utils/colors';
import {
  Calendar,
  Clock,
  User,
  Users,
  Tag,
  ImageOff,
  Video,
  Copy,
  Share2,
  UserPlus,
  Film,
  MoreVertical,
  KeyRound,
  Users2,
  UserCheck,
  TrendingUp,
  IndianRupee,
  ChevronDown,
  Eye,
  ArrowRight,
} from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import AddUserModal from '../../../../../components/AddUserModal';
import PublishRecordingModal from '../../../../../components/PublishRecordingModal';
import {
  getWebinarById,
  grantWebinarAccess,
  publishWebinarRecording,
} from '../../../../../store/WebinarSlice';
import { generateShareLink } from '../../../../../services/AppsFlyerService';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WebinarDetails = () => {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const webinarFromStore = useSelector(
    (state: any) => state.webinarReducer?.current,
  );
  const { user } = useSelector((state: any) => state.userReducer);
  const webinarId = params?.webinarId || params?.id || params?.data?.id;
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showZoomDetails, setShowZoomDetails] = useState(false);
  const zoomAnim = React.useRef(new Animated.Value(0)).current;
  const data = params?.data || webinarFromStore;
  const hasThumbnail = !!data?.thumbnail_url;
  const price = Number(data?.price || 0);

  const scheduledMoment = data?.scheduled_at ? moment(data.scheduled_at) : null;
  const isUpcoming = scheduledMoment
    ? scheduledMoment.isAfter(moment())
    : false;

  const registrations =
    data?.enrollment_count ?? data?.enrollments?.length ?? 0;
  const attended = Array.isArray(data?.enrollments)
    ? data.enrollments.filter((e: any) => e.attended).length
    : 0;
  const attendanceRate =
    registrations > 0 ? Math.round((attended / registrations) * 100) : 0;
  const revenue = data?.revenue ?? 0; // static: only accurate when opened via params.data from the list

  const isOwner = data?.creator?.id
    ? data.creator.id === user?.id
    : data?.creator_id === user?.id;
  const meetingLink = isOwner ? data?.zoom_start_url : data?.zoom_join_url;

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

  useEffect(() => {
    if (!params?.data && webinarId) {
      dispatch(getWebinarById(webinarId));
    }
  }, [dispatch, params?.data, webinarId]);

  const getShareUrl = async (): Promise<string> => {
    return generateShareLink({
      type: 'webinar',
      id: data?.id,
      title: data?.title || 'Webinar',
      description: 'Check out this webinar!',
      imageUrl: data?.thumbnail_url || '',
    });
  };

  const handleCopyLink = async () => {
    const link = await getShareUrl();
    Clipboard.setString(link);
    Toast.show({
      type: 'success',
      text1: 'Webinar link copied',
      position: 'top',
    });
  };

  const handleShareLink = async () => {
    const link = await getShareUrl();
    Share.share({ message: link });
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  if (!data) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Webinar Details" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={'#F0C040'} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeaderWithBack
        title="Webinar Details"
        rightElement={
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            contentStyle={styles.menuContent}
            anchor={
              <Pressable onPress={openMenu} hitSlop={10}>
                <MoreVertical size={wp(20)} color={colors.white} />
              </Pressable>
            }
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(() => setShowPublish(true), 300);
              }}
            >
              <Film size={wp(16)} color={'#D5C4AB'} />
              <Text style={styles.menuItemText}>Publish Recording</Text>
            </TouchableOpacity>
          </Menu>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: hp(120) }}>
        <View style={styles.thumbnailWrapper}>
          {hasThumbnail ? (
            <Image
              source={{ uri: data.thumbnail_url }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <ImageOff size={wp(60)} color={'rgba(255,255,255,0.45)'} />
              <Text style={styles.noImageText}>No Thumbnail Available</Text>
            </View>
          )}
          {scheduledMoment && (
            <View style={styles.thumbnailDateBlock}>
              <Text style={styles.thumbnailDateDay}>
                {scheduledMoment.format('DD')}
              </Text>
              <Text style={styles.thumbnailDateMonth}>
                {scheduledMoment.format('MMM').toUpperCase()}
              </Text>
              <Text style={styles.thumbnailDateMonth}>
                {scheduledMoment.format('ddd').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.thumbnailPricePill}>
            <Text style={styles.thumbnailPriceText}>
              {price > 0 ? `₹${price}` : 'Free'}
            </Text>
          </View>
        </View>

        {scheduledMoment && (
          <View style={styles.statusPillWrap}>
            <View
              style={[
                styles.statusBadge,
                isUpcoming ? styles.statusUpcoming : styles.statusPast,
              ]}
            >
              <Video
                size={wp(12)}
                color={isUpcoming ? colors.success : 'rgba(255,255,255,0.6)'}
              />
              <Text
                style={{
                  color: isUpcoming ? colors.success : 'rgba(255,255,255,0.6)',
                  fontSize: fp(11),
                  fontWeight: '700',
                }}
              >
                {isUpcoming ? 'Upcoming' : 'Past'}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.title}>{data?.title}</Text>
        {!!data?.description && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {data.description}
          </Text>
        )}

        <View style={styles.quickMetaRow}>
          <View style={styles.quickMetaItem}>
            <Calendar size={wp(13)} color={'rgba(255,255,255,0.45)'} />
            <View>
              <Text style={styles.quickMetaValue}>
                {scheduledMoment ? scheduledMoment.format('DD MMM YYYY') : '—'}
              </Text>
              <Text style={styles.quickMetaSub}>
                {scheduledMoment ? scheduledMoment.format('ddd') : ''}
              </Text>
            </View>
          </View>

          <View style={styles.quickMetaItem}>
            <Clock size={wp(13)} color={'rgba(255,255,255,0.45)'} />
            <View>
              <Text style={styles.quickMetaValue}>
                {data?.start_time ||
                  (scheduledMoment ? scheduledMoment.format('HH:mm') : '')}
                {data?.end_time ? ` - ${data.end_time}` : ''}
              </Text>
              {!!data?.duration && (
                <Text style={styles.quickMetaSub}>({data.duration} min)</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatItem}>
            <Eye size={wp(14)} color={'#F0C040'} />
            <View>
              <Text style={styles.quickStatValue}>{registrations}</Text>
              <Text style={styles.quickStatLabel}>Users</Text>
            </View>
          </View>

          <View style={styles.quickStatItem}>
            <Users2 size={wp(14)} color={'#F0C040'} />
            <View>
              <Text style={styles.quickStatValue}>{attended}</Text>
              <Text style={styles.quickStatLabel}>Attended</Text>
            </View>
          </View>

          <View style={styles.quickStatItem}>
            <IndianRupee size={wp(14)} color={'#F0C040'} />
            <View>
              <Text style={styles.quickStatValue}>₹{revenue}</Text>
              <Text style={styles.quickStatLabel}>Revenue</Text>
            </View>
          </View>

          {/* TODO: decide what this should do on the details screen — no target specified yet */}
          <TouchableOpacity
            style={styles.quickStatArrowBtn}
            activeOpacity={0.8}
          >
            <ArrowRight size={wp(16)} color={'#F0C040'} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={styles.linkActionRow}>
          <TouchableOpacity
            style={styles.linkActionButton}
            onPress={handleCopyLink}
            activeOpacity={0.85}
          >
            <Copy size={wp(14)} color={colors.white} />
            <Text style={styles.linkActionText}>Copy Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkActionButton}
            onPress={handleShareLink}
            activeOpacity={0.85}
          >
            <Share2 size={wp(14)} color={colors.white} />
            <Text style={styles.linkActionText}>Share Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkActionButton}
            onPress={() => setShowAddUser(true)}
            activeOpacity={0.85}
          >
            <UserPlus size={wp(14)} color={colors.white} />
            <Text style={styles.linkActionText}>Add User</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <User size={wp(18)} color={'rgba(255,255,255,0.45)'} />
          <Text style={styles.host}>
            Hosted by {data?.creator?.name || 'Unknown'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <User size={wp(15)} color={'rgba(255,255,255,0.45)'} />
              <View>
                <Text style={styles.infoLabel}>Hosted by</Text>
                <Text style={styles.infoValue}>
                  {data?.creator?.name || 'Unknown'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={wp(15)} color={'rgba(255,255,255,0.45)'} />
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {scheduledMoment
                    ? scheduledMoment.format('ddd, DD MMM YYYY')
                    : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Clock size={wp(15)} color={'rgba(255,255,255,0.45)'} />
              <View>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {data?.start_time ||
                    (scheduledMoment ? scheduledMoment.format('HH:mm') : '')}
                  {data?.end_time ? ` - ${data.end_time}` : ''}
                  {data?.duration ? ` (${data.duration} mins)` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Video size={wp(15)} color={'rgba(255,255,255,0.45)'} />
              <View>
                <Text style={styles.infoLabel}>Platform</Text>
                <Text style={styles.infoValue}>Zoom Meeting</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Users size={wp(15)} color={'rgba(255,255,255,0.45)'} />
              <View>
                <Text style={styles.infoLabel}>Max Participants</Text>
                <Text style={styles.infoValue}>
                  {data?.max_participants ?? '—'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Tag size={wp(15)} color={'rgba(255,255,255,0.45)'} />
              <View>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>
                  {price > 0 ? 'Paid' : 'Free'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <Users2 size={wp(16)} color={'#F0C040'} strokeWidth={2} />
            <Text style={styles.statTileValue}>{registrations}</Text>
            <Text style={styles.statTileLabel}>Users</Text>
          </View>
          <View style={styles.statTile}>
            <UserCheck size={wp(16)} color={'#F0C040'} strokeWidth={2} />
            <Text style={styles.statTileValue}>{attended}</Text>
            <Text style={styles.statTileLabel}>Attended</Text>
          </View>
          <View style={styles.statTile}>
            <TrendingUp size={wp(16)} color={'#F0C040'} strokeWidth={2} />
            <Text style={styles.statTileValue}>{attendanceRate}%</Text>
            <Text style={styles.statTileLabel}>Attendance</Text>
          </View>
          <View style={styles.statTile}>
            <IndianRupee size={wp(16)} color={'#F0C040'} strokeWidth={2} />
            <Text style={styles.statTileValue}>{revenue}</Text>
            <Text style={styles.statTileLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Tag size={wp(14)} color={'#F0C040'} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: hp(20) }]}>
          About Webinar
        </Text>
        <Text style={styles.description}>{data?.description}</Text>

        {data?.zoom_meeting_id && (
          <View style={styles.zoomSection}>
            <View style={styles.zoomHeaderRow}>
              <TouchableOpacity
                style={styles.zoomToggle}
                onPress={toggleZoomDetails}
                activeOpacity={0.7}
              >
                <KeyRound size={wp(16)} color={'#F0C040'} />
                <Text style={styles.zoomToggleText}>Zoom Details</Text>
                <Animated.View style={{ transform: [{ rotate: zoomRotate }] }}>
                  <ChevronDown size={wp(16)} color={'#F0C040'} />
                </Animated.View>
              </TouchableOpacity>
              {!!meetingLink && (
                <TouchableOpacity
                  style={styles.joinBtn}
                  activeOpacity={0.85}
                  onPress={() => Linking.openURL(meetingLink)}
                >
                  <Video size={wp(13)} color={colors.black} />
                  <Text style={styles.joinBtnText}>Join Meeting</Text>
                </TouchableOpacity>
              )}
            </View>
            {showZoomDetails && (
              <View style={styles.zoomDetails}>
                <View style={styles.zoomRow}>
                  <View style={styles.zoomInfo}>
                    <Text style={styles.zoomLabel}>Meeting ID</Text>
                    <Text style={styles.zoomValue}>{data.zoom_meeting_id}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Clipboard.setString(data.zoom_meeting_id);
                      Toast.show({
                        type: 'success',
                        text1: 'Meeting ID copied!',
                        position: 'top',
                      });
                    }}
                  >
                    <Copy size={wp(14)} color={'#F0C040'} />
                  </TouchableOpacity>
                </View>
                {!!data?.zoom_password && (
                  <View style={styles.zoomRow}>
                    <View style={styles.zoomInfo}>
                      <Text style={styles.zoomLabel}>Password</Text>
                      <Text style={styles.zoomValue}>{data.zoom_password}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Clipboard.setString(data.zoom_password);
                        Toast.show({
                          type: 'success',
                          text1: 'Password copied!',
                          position: 'top',
                        });
                      }}
                    >
                      <Copy size={wp(14)} color={'#F0C040'} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <AddUserModal
        visible={showAddUser}
        onClose={() => setShowAddUser(false)}
        productTitle={data?.title || 'this webinar'}
        productType="webinar"
        onGrant={identifier =>
          dispatch(
            grantWebinarAccess({
              webinarId: data?.id || webinarId,
              ...identifier,
            }),
          ).unwrap()
        }
      />

      <PublishRecordingModal
        visible={showPublish}
        onClose={() => setShowPublish(false)}
        webinarTitle={data?.title || 'this webinar'}
        onPublish={args =>
          dispatch(
            publishWebinarRecording({
              webinarId: data?.id || webinarId,
              ...args,
            }),
          ).unwrap()
        }
      />
    </View>
  );
};

export default WebinarDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  thumbnailWrapper: {
    marginHorizontal: wp(16),
    height: hp(220),
    backgroundColor: '#1A1A1A',
    borderRadius: wp(18),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: hp(8),
    color: 'rgba(255,255,255,0.45)',
    fontSize: fp(14),
  },

  title: {
    fontSize: fp(22),
    fontWeight: '700',
    marginTop: hp(15),
    paddingHorizontal: wp(16),
    color: colors.white,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(8),
    paddingHorizontal: wp(16),
    gap: wp(6),
  },
  host: {
    color: '#D9C7A3',
    fontSize: fp(14),
  },
  detailText: {
    color: '#D9C7A3',
    fontSize: fp(14),
  },
  linkActionRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(12),
    paddingHorizontal: wp(16),
  },
  linkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: hp(9),
    paddingHorizontal: wp(14),
    borderRadius: wp(20),
  },
  linkActionText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '700',
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(15),
    paddingHorizontal: wp(16),
    gap: wp(8),
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240,192,64,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.35)',
    paddingVertical: hp(5),
    paddingHorizontal: wp(10),
    borderRadius: wp(20),
    gap: wp(4),
  },

  tagText: {
    color: '#E9C47C',
    fontSize: fp(12),
  },

  priceBox: {
    backgroundColor: '#1A1A1A',
    padding: wp(16),
    borderRadius: wp(18),
    marginHorizontal: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(6),
  },
  priceLabel: {
    color: 'rgba(255,255,255,0.55)',
  },
  priceValue: {
    fontWeight: '600',
    color: colors.white,
  },
  totalRow: {
    borderTopWidth: wp(1),
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: hp(10),
    paddingTop: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
  totalValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: '#F0C040',
  },
  participants: {
    fontSize: fp(14),
    color: '#D9C7A3',
    marginTop: hp(10),
  },

  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '600',
    paddingHorizontal: wp(16),
    color: colors.white,
  },
  description: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(8),
    paddingHorizontal: wp(16),
    lineHeight: fp(20),
    paddingBottom: hp(40),
  },
  thumbnailDateBlock: {
    position: 'absolute',
    top: hp(10),
    left: wp(10),
    width: wp(48),
    height: wp(54),
    borderRadius: wp(10),
    backgroundColor: 'rgba(15,15,15,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.4)',
  },
  thumbnailDateDay: {
    fontSize: fp(18),
    fontWeight: '800',
    color: '#F0C040',
    lineHeight: fp(20),
  },
  thumbnailDateMonth: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#F0C040',
    letterSpacing: 0.5,
  },
  thumbnailPricePill: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    backgroundColor: '#F0C040',
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(20),
  },
  thumbnailPriceText: {
    fontSize: fp(11),
    fontWeight: '800',
    color: colors.black,
  },
  statusPillWrap: {
    marginTop: -hp(14),
    marginLeft: wp(28),
    alignSelf: 'flex-start',
    zIndex: 2,
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
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  statusPast: {
    backgroundColor: 'rgba(85,85,88,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(85,85,88,0.3)',
  },
  subtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.55)',
    marginTop: hp(4),
    paddingHorizontal: wp(16),
    lineHeight: fp(18),
  },
  quickMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },
  quickMetaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(6),
  },
  quickMetaValue: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.white,
  },
  quickMetaSub: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(1),
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    marginHorizontal: wp(16),
    marginTop: hp(14),
    paddingVertical: hp(12),
    paddingHorizontal: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.15)',
  },
  quickStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  quickStatValue: {
    fontSize: fp(12.5),
    fontWeight: '800',
    color: colors.white,
  },
  quickStatLabel: {
    fontSize: fp(9.5),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginTop: hp(1),
  },
  quickStatArrowBtn: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    borderWidth: 1.5,
    borderColor: '#F0C040',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(6),
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: wp(16),
    marginHorizontal: wp(16),
    marginTop: hp(16),
    padding: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoCol: {
    flex: 1,
    gap: hp(12),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(8),
  },
  infoLabel: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: fp(12.5),
    color: colors.white,
    fontWeight: '600',
    marginTop: hp(2),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: wp(10),
    marginHorizontal: wp(16),
    marginTop: hp(14),
  },
  statTile: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.18)',
    paddingVertical: hp(12),
    alignItems: 'center',
    gap: hp(4),
  },
  statTileValue: {
    fontSize: fp(14),
    fontWeight: '800',
    color: colors.white,
  },
  statTileLabel: {
    fontSize: fp(9.5),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  zoomSection: {
    marginHorizontal: wp(16),
    marginTop: hp(20),
    backgroundColor: 'rgba(240,192,64,0.05)',
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.15)',
  },
  zoomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  zoomToggleText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: '#F0C040',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: '#F0C040',
    paddingHorizontal: wp(12),
    paddingVertical: hp(7),
    borderRadius: wp(20),
  },
  joinBtnText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.black,
  },
  zoomDetails: {
    marginTop: hp(12),
    gap: hp(10),
  },
  zoomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoomInfo: {
    flex: 1,
  },
  zoomLabel: {
    fontSize: fp(9),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  zoomValue: {
    fontSize: fp(13),
    color: colors.white,
    fontWeight: '700',
    marginTop: hp(2),
  },
  menuContent: {
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: wp(180),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  menuItemText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#D5C4AB',
  },
});
