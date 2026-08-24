import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
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

const WebinarDetails = () => {
  const { params } = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const webinarFromStore = useSelector(
    (state: any) => state.webinarReducer?.current,
  );
  const webinarId = params?.webinarId || params?.id || params?.data?.id;
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const data = params?.data || webinarFromStore;
  const hasThumbnail = !!data?.thumbnail_url;
  const price = Number(data?.price || 0);
  const gst = (price * 18) / 100;
  const platformFee = (price * 2) / 100;
  const total = price + gst + platformFee;

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
      <AppHeaderWithBack title="Webinar Details" />

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
        </View>

        <Text style={styles.title}>{data?.title}</Text>

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

          <TouchableOpacity
            style={styles.linkActionButton}
            onPress={() => setShowPublish(true)}
            activeOpacity={0.85}
          >
            <Film size={wp(14)} color={colors.white} />
            <Text style={styles.linkActionText}>Publish Recording</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <User size={wp(18)} color={'rgba(255,255,255,0.45)'} />
          <Text style={styles.host}>
            Hosted by {data?.creator?.name || 'Unknown'}
          </Text>
        </View>

        <View style={styles.row}>
          <Calendar size={wp(18)} color={'rgba(255,255,255,0.45)'} />
          <Text style={styles.detailText}>
            {new Date(data?.scheduled_at).toDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={wp(18)} color={'rgba(255,255,255,0.45)'} />
          <Text style={styles.detailText}>
            {new Date(data?.scheduled_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            ({data?.duration} mins)
          </Text>
        </View>

        <View style={styles.row}>
          <Video size={wp(18)} color={'rgba(255,255,255,0.45)'} />
          <Text style={styles.detailText}>Zoom Meeting</Text>
        </View>

        <View style={styles.row}>
          <Users size={wp(18)} color={'rgba(255,255,255,0.45)'} />
          <Text style={styles.detailText}>
            Max Participants: {data?.max_participants}
          </Text>
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

        <View style={styles.priceBox}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>
            Payment Details
          </Text>

          <PriceRow label="Webinar Fee" value={`₹${price}`} />
          <PriceRow label="GST (18%)" value={`₹${gst.toFixed(2)}`} />
          <PriceRow
            label="Platform Fee (2%)"
            value={`₹${platformFee.toFixed(2)}`}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <AddUserModal
        visible={showAddUser}
        onClose={() => setShowAddUser(false)}
        productTitle={data?.title || 'this webinar'}
        productType="webinar"
        onGrant={identifier =>
          dispatch(
            grantWebinarAccess({ webinarId: data?.id || webinarId, ...identifier }),
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

const PriceRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>{label}</Text>
    <Text style={styles.priceValue}>{value}</Text>
  </View>
);

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
});
