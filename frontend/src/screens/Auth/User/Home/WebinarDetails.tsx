import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, { useState } from 'react';
import { useRoute } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import { Calendar, Clock, User, Tag, ImageOff } from 'lucide-react-native';
import {
  createWebinarEnroll,
  createWebinarVerify,
} from '../../../../store/WebinarSlice';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';

const WebinarDetails = () => {
  const { params } = useRoute();
  const data = params?.data;
  const hasThumbnail = !!data?.thumbnail_url;
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state: any) => state.userReducer);

  const onVerifyWebinar = async () => {
    try {
      // Step 1: Create Razorpay order
      const orderResponse = await dispatch(
        createWebinarEnroll(data?.id),
      ).unwrap();
      console.log('--orderResponse--', orderResponse);

      // Extract data from response
      const razorpay_order = orderResponse?.razorpay_order;
      const razorpay_key_id = orderResponse?.razorpay_key_id;
      const user_details = orderResponse?.user_details;
      const course_details = orderResponse?.course_details;

      // Razorpay Checkout Options
      const options = {
        description: course_details?.title || course.title,
        image: course_details?.thumbnail || course.thumbnail || '',
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

      // Razorpay Checkout UI
      const paymentResult = await RazorpayCheckout.open(options);

      Toast.show({
        type: 'info',
        text1: 'Verifying Payment...',
        text2: 'Please wait a moment.',
      });

      // Step 3: Verify payment on backend
      await dispatch(
        createWebinarVerify({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
        }),
      ).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Payment Successful 🎉',
        text2: 'You have successfully enrolled in this webinar.',
      });
    } catch (error) {
      console.log('----Payment Error: ---', error);

      Toast.show({
        type: 'error',
        text1: 'Payment Failed ❌',
        text2: error?.message || 'Something went wrong, please try again.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Webinar Details" />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.thumbnailWrapper}>
          {hasThumbnail ? (
            <Image
              source={{ uri: data.thumbnail_url }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <ImageOff size={60} color={colors.textSecondary} />
              <Text style={styles.noImageText}>No Thumbnail Available</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{data?.title}</Text>

        <View style={styles.row}>
          <User size={18} color={colors.textSecondary} />
          <Text style={styles.host}>
            Hosted by {data?.creator?.name || 'Unknown'}
          </Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(data?.scheduled_at).toDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={18} color={colors.textSecondary} />
          <Text style={styles.detailText}>{data?.duration} mins</Text>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Tag size={14} color={colors.white} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.price}>₹ {data?.price}</Text>
          <Text style={styles.participants}>
            Max Participants: {data?.max_participants}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>About Webinar</Text>
        <Text style={styles.description}>{data?.description}</Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.buyButton} onPress={onVerifyWebinar}>
          <Text style={styles.buyText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WebinarDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  thumbnailWrapper: {
    width: '100%',
    height: 220,
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
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 15,
    paddingHorizontal: 15,
    color: colors.text,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 15,
    gap: 6,
  },
  host: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    paddingHorizontal: 15,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secPrimary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  tagText: {
    color: colors.white,
    fontSize: 12,
  },

  priceBox: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
  },
  participants: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 25,
    paddingHorizontal: 15,
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    paddingHorizontal: 15,
    lineHeight: 20,
    paddingBottom: 40,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 15,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  buyButton: {
    backgroundColor: colors.secPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
