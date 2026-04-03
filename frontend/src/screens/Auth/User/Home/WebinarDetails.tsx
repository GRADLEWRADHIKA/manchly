import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { useRoute } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {
  Calendar,
  Clock,
  User,
  Users,
  Tag,
  ImageOff,
  Video,
} from 'lucide-react-native';
import {
  createWebinarEnroll,
  createWebinarVerify,
} from '../../../../store/WebinarSlice';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import { wp, hp, fp } from '../../../../utils/responsive';

const WebinarDetails = () => {
  const { params } = useRoute();
  const data = params?.data;
  const hasThumbnail = !!data?.thumbnail_url;
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const { user, token } = useSelector((state: any) => state.userReducer);

  const price = Number(data?.price || 0);
  const gst = (price * 18) / 100;
  const platformFee = (gst * 5) / 100;
  const total = price + gst + platformFee;
  const amountInPaise = Math.round(total * 100);

  const onVerifyWebinar = async () => {
    setLoading(true);

    try {
      // ------------------------------
      // Step 1: CREATE ORDER
      // ------------------------------
      let orderResponse;
      try {
        const payload = { webinar_id: data?.id };
        orderResponse = await dispatch(createWebinarEnroll(payload)).unwrap();
      } catch (err) {
        return;
      }

      const razorpay_order = orderResponse?.data?.data?.razorpay_order;
      const razorpay_key_id = orderResponse?.data?.data?.razorpay_key_id;
      const user_details = orderResponse?.data?.data?.user_details;
      const webinar_details = orderResponse?.data?.data?.webinar_details;

      // ------------------------------
      // Step 2: OPEN RAZORPAY
      // ------------------------------
      let paymentResult;
      try {
        const options = {
          description: webinar_details?.title,
          image: webinar_details?.thumbnail,
          currency: razorpay_order.currency || 'INR',
          key: razorpay_key_id,
          amount: razorpay_order.amount,
          name: 'Manchly',
          order_id: razorpay_order.id,
          prefill: {
            email: user_details?.email || user?.email || '',
            contact: user_details?.phone || user?.phone || '',
            name: user_details?.name || user?.name || user?.full_name || '',
          },
          theme: { color: colors.primary },
        };

        paymentResult = await RazorpayCheckout.open(options);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Payment Cancelled ❌',
          text2: 'You cancelled the payment or something went wrong.',
        });
        return; // STOP here
      }

      Toast.show({
        type: 'info',
        text1: 'Verifying Payment...',
        text2: 'Please wait a moment.',
      });

      // ------------------------------
      // Step 3: VERIFY PAYMENT on Backend
      // ------------------------------
      try {
        await dispatch(
          createWebinarVerify({
            razorpay_order_id: paymentResult.razorpay_order_id,
            razorpay_payment_id: paymentResult.razorpay_payment_id,
            razorpay_signature: paymentResult.razorpay_signature,
          }),
        ).unwrap();
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed ❌',
          text2: err?.message || 'Unable to verify your payment.',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Payment Successful 🎉',
        text2: 'You have successfully enrolled in this webinar.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error ❌',
        text2: error?.message || 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.detailText}>Max Participants: {data?.max_participants}</Text>
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
          <Text style={[styles.sectionTitle, {paddingHorizontal: 0}]}>Payment Details</Text>

          <PriceRow label="Webinar Fee" value={`₹${price}`} />
          <PriceRow label="GST (18%)" value={`₹${gst.toFixed(2)}`} />
          <PriceRow
            label="Platform Fee (5%)"
            value={`₹${platformFee.toFixed(2)}`}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>

        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {data?.is_enrolled ? (
          <View style={[styles.buyButton, { backgroundColor: colors.success }]}>
            <Text style={styles.buyText}>Already Enrolled</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.buyButton}
            onPress={onVerifyWebinar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size={'small'} />
            ) : (
              <Text style={styles.buyText}>
                Purchase for ₹{total.toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: colors.secPrimary,
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
