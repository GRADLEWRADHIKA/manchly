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
import React, { useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import colors from '../../../../../utils/colors';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
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
} from 'lucide-react-native';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { getWebinarById } from '../../../../../store/WebinarSlice';
import { createDynamicLink } from 'react-native-chottulink-sdk';
import AiButton from '../../../../../components/AiButton';
import EmailSeriesModal from '../../../../../components/ai/EmailSeriesModal';
import SocialPostsModal from '../../../../../components/ai/SocialPostsModal';

const WebinarDetails = () => {
  const [showEmails, setShowEmails] = React.useState(false);
  const [showSocialPosts, setShowSocialPosts] = React.useState(false);
  const { params } = useRoute<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const webinarFromStore = useSelector(
    (state: any) => state.webinarReducer?.current,
  );
  const webinarId = params?.webinarId || params?.id || params?.data?.id;
  const data = params?.data || webinarFromStore;
  const webinarLink = `https://manchly.chottu.link/webinar/${data?.id}`;
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

  const getDynamicLink = async (): Promise<string> => {
    try {
      const result = await createDynamicLink({
        destinationURL: webinarLink,
        domain: 'manchly.chottu.link',
        socialTitle: data?.title || 'Webinar',
        socialDescription: 'Check out this webinar!',
        socialImageUrl: data?.thumbnail_url || '',
      });
      return result.shortURL;
    } catch {
      return webinarLink;
    }
  };

  const handleCopyLink = async () => {
    const link = await getDynamicLink();
    Clipboard.setString(link);
    Toast.show({
      type: 'success',
      text1: 'Webinar link copied',
      position: 'bottom',
    });
  };

  const handleShareLink = async () => {
    const link = await getDynamicLink();
    Share.share({ message: link });
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Webinar Details" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
              <ImageOff size={wp(60)} color={colors.textSecondary} />
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
        </View>

        <View style={styles.linkActionRow}>
          <AiButton label="Generate Emails" onPress={() => setShowEmails(true)} />
          <AiButton label="Social Posts" onPress={() => setShowSocialPosts(true)} />
        </View>

        <View style={styles.row}>
          <User size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.host}>
            Hosted by {data?.creator?.name || 'Unknown'}
          </Text>
        </View>

        <View style={styles.row}>
          <Calendar size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(data?.scheduled_at).toDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(data?.scheduled_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            ({data?.duration} mins)
          </Text>
        </View>

        <View style={styles.row}>
          <Video size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.detailText}>Zoom Meeting</Text>
        </View>

        <View style={styles.row}>
          <Users size={wp(18)} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            Max Participants: {data?.max_participants}
          </Text>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Tag size={wp(14)} color={colors.white} />
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

      <EmailSeriesModal
        visible={showEmails}
        onClose={() => setShowEmails(false)}
        title={data?.title || ''}
        scheduledAt={data?.scheduled_at}
      />

      <SocialPostsModal
        visible={showSocialPosts}
        onClose={() => setShowSocialPosts(false)}
        title={data?.title || ''}
        description={data?.description}
        scheduledAt={data?.scheduled_at}
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
    backgroundColor: colors.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  thumbnailWrapper: {
    width: '100%',
    height: hp(220),
    backgroundColor: colors.lightGrey,
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
    color: colors.textSecondary,
    fontSize: fp(14),
  },

  title: {
    fontSize: fp(22),
    fontWeight: '700',
    marginTop: hp(15),
    paddingHorizontal: wp(15),
    color: colors.text,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(8),
    paddingHorizontal: wp(15),
    gap: wp(6),
  },
  host: {
    color: colors.textSecondary,
    fontSize: fp(14),
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: fp(14),
  },
  linkActionRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(12),
    paddingHorizontal: wp(15),
  },
  linkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.primary,
    paddingVertical: hp(9),
    paddingHorizontal: wp(12),
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
    paddingHorizontal: wp(15),
    gap: wp(8),
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: hp(5),
    paddingHorizontal: wp(10),
    borderRadius: wp(20),
    gap: wp(4),
  },

  tagText: {
    color: colors.white,
    fontSize: fp(12),
  },

  priceBox: {
    backgroundColor: colors.surface,
    padding: wp(16),
    borderRadius: wp(12),
    marginHorizontal: wp(15),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(6),
  },
  priceLabel: {
    color: colors.textSecondary,
  },
  priceValue: {
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: wp(1),
    borderColor: colors.border,
    marginTop: hp(10),
    paddingTop: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  totalValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.primary,
  },
  participants: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginTop: hp(10),
  },

  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '600',
    paddingHorizontal: wp(15),
    color: colors.text,
  },
  description: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginTop: hp(8),
    paddingHorizontal: wp(15),
    lineHeight: fp(20),
    paddingBottom: hp(40),
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: wp(15),
    backgroundColor: colors.white,
    borderTopWidth: wp(1),
    borderColor: colors.border,
    marginBottom: hp(10),
  },
  buyButton: {
    backgroundColor: colors.secPrimary,
    paddingVertical: hp(14),
    borderRadius: wp(10),
    alignItems: 'center',
  },
  buyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(16),
  },
});
