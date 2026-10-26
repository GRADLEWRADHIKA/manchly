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
import WebinarPreviewModal from './WebinarPreviewModal';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
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
  ChevronDown,
  Eye,
  Edit3,
  FileText,
  UserPlus,
  Link2,
  Users2,
  Trash2,
  MoreVertical,
  Copy,
} from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { generateShareLink } from '../../../../../services/AppsFlyerService';
import DynamicModal from '../../../../../components/CommonModal';
import AddUserModal from '../../../../../components/AddUserModal';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  deleteWebinar,
  updateWebinar,
  grantWebinarAccess,
} from '../../../../../store/WebinarSlice';
import { useNavigation } from '@react-navigation/native';

interface WebinarData {
  id: string;
  title: string;
  thumbnail_url?: string;
  price: number;
  scheduled_at: string | Date;
  duration?: number;
  status?: string;
  zoom_meeting_id?: string;
  zoom_password?: string;
  zoom_start_url?: string;
  start_time?: string;
  end_time?: string;
  enrollment_count?: number;
  revenue?: number;
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
  const [showZoomDetails, setShowZoomDetails] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [showAddUser, setShowAddUser] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const zoomAnim = useRef(new Animated.Value(0)).current;
  const Nav = useNavigation<any>();

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => {
    setMenuVisible(false);
    setMenuKey(k => k + 1);
  };

  const [showPreview, setShowPreview] = useState(false);

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

  const handleCopyLink = async () => {
    const link = await generateShareLink({
      type: 'webinar',
      id: data?.id,
      title: data?.title || 'Webinar',
      description: 'Check out this webinar!',
      imageUrl: data?.thumbnail_url || '',
    });
    copyToClipboard(link, 'Webinar link');
  };

  const isDraft = (data.status || '').toUpperCase() === 'DRAFT';

  const handleToggleDraft = () => {
    setStatusLoading(true);
    dispatch(
      updateWebinar({
        webinar_id: data.id,
        body: { status: isDraft ? 'PUBLISHED' : 'DRAFT' },
      }),
    )
      .unwrap()
      .then(() => {
        setRefreshWebinar?.(true);
      })
      .finally(() => setStatusLoading(false));
  };

  const scheduledDate = moment(data.scheduled_at);
  const isUpcoming = !isDraft && scheduledDate.isAfter(moment());
  const hasThumbnail = !!data.thumbnail_url;

  return (
    <>
      <View style={styles.card}>
        {/* 3-dot menu, top right */}
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
                <MoreVertical size={wp(18)} color={'rgba(255,255,255,0.6)'} />
              </TouchableOpacity>
            }
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(() => setShowPreview(true), 350);
              }}
            >
              <Eye size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>
                Preview
              </Text>
            </TouchableOpacity>

              <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(handleToggleDraft, 350);
              }}
              disabled={statusLoading}
            >
              <FileText size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>
                {isDraft ? 'Publish Webinar' : 'Draft Webinar'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(() => Nav.navigate('CreateWebinar', { data }), 350);
              }}
            >
              <Edit3 size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>
                Edit
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(handleCopyLink, 350);
              }}
            >
              <Link2 size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>
                Share
              </Text>
            </TouchableOpacity>

             <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(() => setShowAddUser(true), 350);
              }}
            >
              <UserPlus size={wp(16)} color={'#D5C4AB'} />
              <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>
                Add User
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                setTimeout(() => setShowModal(true), 350);
              }}
            >
              <Trash2 size={wp(16)} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>
                Delete 
              </Text>
            </TouchableOpacity>
          </Menu>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => Nav.navigate('WebinarDetails', { data })}
        >
          {/* Top row: thumbnail + info */}
          <View style={styles.topRow}>
            <View style={styles.thumbnailWrap}>
              {hasThumbnail ? (
                <Image
                  source={{ uri: data.thumbnail_url }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                  <Video
                    size={wp(24)}
                    color={colors.goldDim}
                    strokeWidth={1.4}
                  />
                </View>
              )}
            </View>

            <View style={styles.infoCol}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusBadge,
                    isDraft
                      ? styles.statusDraft
                      : isUpcoming
                      ? styles.statusUpcoming
                      : styles.statusPast,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isDraft
                          ? colors.textMuted
                          : isUpcoming
                          ? colors.creatorGreen
                          : colors.textMuted,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isDraft
                          ? colors.textMuted
                          : isUpcoming
                          ? colors.creatorGreen
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {isDraft ? 'Draft' : isUpcoming ? 'Upcoming' : 'Past'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.priceBadge,
                    !data.price && styles.priceBadgeFree,
                  ]}
                >
                  <Text
                    style={[
                      styles.priceText,
                      !data.price && styles.priceTextFree,
                    ]}
                  >
                    {data.price ? 'Paid' : 'Free'}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={2} style={styles.title}>
                {data?.title}
              </Text>

              <View style={styles.metaItem}>
                <Calendar size={wp(12)} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {scheduledDate.format('ddd, DD MMM YYYY')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={wp(12)} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {data?.start_time || scheduledDate.format('HH:mm')}
                  {data?.end_time ? ` – ${data.end_time}` : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Stats row: Registrations | Revenue */}
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Users2 size={wp(20)} color={colors.gold} strokeWidth={2} />
              <Text style={styles.statBlockValue}>
                {data?.enrollment_count ?? 0}
              </Text>
              <Text style={styles.statBlockLabel}>Registrations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <IndianRupee size={wp(20)} color={colors.gold} strokeWidth={2} />
              <Text style={styles.statBlockValue}>{data?.revenue ?? 0}</Text>
              <Text style={styles.statBlockLabel}>Revenue</Text>
            </View>
          </View>

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
                  <Video size={wp(16)} color={colors.textPrimary} />
                  <Text style={styles.zoomToggleText}>Zoom Details</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: zoomRotate }] }}>
                  <ChevronDown size={wp(18)} color={colors.textPrimary} />
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
                      const text = `Meeting ID: ${
                        data.zoom_meeting_id
                      }\nPassword: ${data.zoom_password || ''}`;
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
        </TouchableOpacity>
      </View>

      <DynamicModal
        visible={showModal}
        heading="Delete Webinar"
        message="Are you sure you want to delete this webinar?"
        onCancel={() => setShowModal(false)}
        onDelete={handleDelete}
        loading={deleteLoader}
      />

      <AddUserModal
        visible={showAddUser}
        onClose={() => setShowAddUser(false)}
        productTitle={data?.title || 'this webinar'}
        productType="webinar"
        onGrant={identifier =>
          dispatch(
            grantWebinarAccess({ webinarId: data?.id, ...identifier }),
          ).unwrap()
        }
      />
      <WebinarPreviewModal
        visible={showPreview}
        item={data}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: wp(18),
    marginBottom: hp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#161616',
  },
  topRow: {
    flexDirection: 'row',
    gap: wp(12),
    paddingRight: wp(28), // leave room for the menu button
  },
  thumbnailWrap: {
    width: wp(96),
    height: wp(96),
    borderRadius: wp(14),
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.inputBg,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,192,64,0.06)',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: hp(5),
  },
  badgeRow: {
    flexDirection: 'row',
    gap: wp(8),
    marginBottom: hp(2),
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
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  statusPast: {
    backgroundColor: 'rgba(85,85,88,0.18)',
  },
  statusDraft: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
  },
  statusText: {
    fontSize: fp(11),
    fontWeight: '700',
  },
  priceBadge: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(4),
    borderRadius: wp(20),
    backgroundColor: colors.gold,
  },
  priceBadgeFree: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  priceText: {
    color: colors.bg,
    fontSize: fp(11),
    fontWeight: '800',
  },
  priceTextFree: {
    color: colors.bg,
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(20),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  metaText: {
    fontSize: fp(11.5),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: hp(12),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: hp(4),
  },
  statDivider: {
    width: 1,
    height: hp(40),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statBlockValue: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statBlockLabel: {
    fontSize: fp(11),
    color: colors.textMuted,
    fontWeight: '600',
  },
  zoomToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoomToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  zoomToggleText: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  zoomDetails: {
    marginTop: hp(10),
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
  zoomInfo: { flex: 1 },
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
  },
  startMeetingText: {
    color: colors.bg,
    fontSize: fp(12),
    fontWeight: '700',
  },
  menuAnchor: {
    position: 'absolute',
    top: wp(14),
    right: wp(14),
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
    minWidth: wp(180),
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
