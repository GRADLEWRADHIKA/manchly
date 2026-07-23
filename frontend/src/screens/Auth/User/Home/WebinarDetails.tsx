import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
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
  getWebinarById,
  createWebinarVerify,
} from '../../../../store/WebinarSlice';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFEnvironment,
  CFSession,
  CFDropCheckoutPayment,
  CFThemeBuilder,
} from 'cashfree-pg-api-contract';
import Toast from 'react-native-toast-message';
import NotificationService from '../../../../services/NotificationService';
import { wp, hp, fp } from '../../../../utils/responsive';
import TermsModal from '../../../../components/TermsModal';
import PrivacyModal from '../../../../components/PrivacyModal';
import RefundPolicyModal from '../../../../components/RefundPolicyModal';

const WebinarDetails = () => {
  const { params } = useRoute<any>();
  const webinarId = params?.webinarId || params?.id || params?.data?.id;
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const { user, token } = useSelector((state: any) => state.userReducer);
  const webinarFromStore = useSelector(
    (state: any) => state.webinarReducer?.current,
  );
  const data = params?.data || webinarFromStore;
  const hasThumbnail = !!data?.thumbnail_url;
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  useEffect(() => {
    if (!params?.data && webinarId) {
      dispatch(getWebinarById(webinarId));
    }
  }, [dispatch, params?.data, webinarId]);

  const price = Number(data?.price || 0);
  const gst = (price * 18) / 100;
  const platformFee = (price * 2) / 100;
  const total = price + gst + platformFee;

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!data?.scheduled_at) return;

    const targetDate = new Date(data.scheduled_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft('Started');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      if (hours > 0 || days > 0) timeString += `${hours}h `;
      timeString += `${minutes}m ${seconds}s`;

      setTimeLeft(timeString);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [data?.scheduled_at]);

  // Store the pending order ID in a ref so the Cashfree callback can access it
  const pendingOrderRef = useRef<string | null>(null);

  const pollPaymentVerify = async (orderId: string, retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await dispatch(createWebinarVerify({ order_id: orderId })).unwrap();
        return res;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  // Register Cashfree callbacks once, clean up on unmount
  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify: async (orderIdFromSDK: string) => {
        const orderId = pendingOrderRef.current;
        if (!orderId) return;
        pendingOrderRef.current = null;

        Toast.show({
          type: 'info',
          text1: 'Verifying Payment...',
          text2: 'Please wait a moment.',
        });

        try {
          await pollPaymentVerify(orderId);

          NotificationService.displayNotification(
            'Webinar Booked Successfully',
            `You have successfully enrolled in "${data?.title || 'the webinar'}". Check your purchases for meeting details.`,
            { type: 'webinar_purchase', webinarId },
          );

          Toast.show({
            type: 'success',
            text1: 'Payment Successful',
            text2: 'You have successfully enrolled in this webinar.',
          });
        } catch (err: any) {
          Toast.show({
            type: 'error',
            text1: 'Verification Failed',
            text2: err?.message || 'Unable to verify your payment.',
          });
        } finally {
          setLoading(false);
        }
      },
      onError: (error: any, orderIdFromSDK: string) => {
        pendingOrderRef.current = null;
        const msg =
          error?.code === 'action_cancelled'
            ? 'You cancelled the payment.'
            : error?.message || 'Something went wrong.';
        Toast.show({
          type: 'error',
          text1:
            error?.code === 'action_cancelled'
              ? 'Payment Cancelled'
              : 'Payment Failed',
          text2: msg,
        });
        setLoading(false);
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  const onVerifyWebinar = async () => {
    setLoading(true);

    try {
      // Step 1: CREATE ORDER
      let orderResponse;
      try {
        const payload = { webinar_id: data?.id, amount: total };
        orderResponse = await dispatch(createWebinarEnroll(payload)).unwrap();
      } catch (err) {
        setLoading(false);
        return;
      }

      const responseData = orderResponse?.data?.data;
      const cashfree_order = responseData?.cashfree_order;
      const cashfree_env = responseData?.cashfree_env;

      if (!cashfree_order?.payment_session_id || !cashfree_order?.order_id) {
        Toast.show({
          type: 'error',
          text1: 'Invalid payment order',
          position: 'top',
        });
        setLoading(false);
        return;
      }

      // Store order ID for callback
      pendingOrderRef.current = cashfree_order.order_id;

      // Step 2: Open Cashfree checkout
      const env =
        cashfree_env === 'PRODUCTION'
          ? CFEnvironment.PRODUCTION
          : CFEnvironment.SANDBOX;

      const session = new CFSession(
        cashfree_order.payment_session_id,
        cashfree_order.order_id,
        env,
      );

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor(colors.primary)
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor(colors.secPrimary)
        .setButtonTextColor('#FFFFFF')
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, null, theme);
      CFPaymentGatewayService.doPayment(dropPayment);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Unexpected Error',
        text2: error?.message || 'Something went wrong.',
      });
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Webinar Details" bgColor={colors.uBg} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Webinar Details" bgColor={colors.uBg} />

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

        {timeLeft ? (
          <View style={styles.countdownContainer}>
            <Clock size={wp(18)} color={colors.gold} />
            <Text style={styles.countdownText}>Starts in: {timeLeft}</Text>
          </View>
        ) : null}

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
          <Video size={wp(18)} color={colors.textPrimary} />
          <Text style={styles.detailText}>Zoom Meeting</Text>
        </View>

        <View style={styles.row}>
          <Users size={wp(18)} color={colors.textPrimary} />
          <Text style={styles.detailText}>
            Max Participants: {data?.max_participants}
          </Text>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Tag size={wp(14)} color={colors.textPrimary} />
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

        <Text style={styles.policyText}>
          By purchasing, you agree to our{' '}
          <Text style={styles.policyLink} onPress={() => setShowTerms(true)}>
            Terms of Service
          </Text>
          ,{' '}
          <Text style={styles.policyLink} onPress={() => setShowPrivacy(true)}>
            Privacy Policy
          </Text>
          {' & '}
          <Text style={styles.policyLink} onPress={() => setShowRefund(true)}>
            Refund Policy
          </Text>
        </Text>
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <RefundPolicyModal visible={showRefund} onClose={() => setShowRefund(false)} />

      <View style={styles.bottomBar}>
        {data?.is_enrolled ? (
          <View style={[styles.buyButton, { backgroundColor: colors.success }]}>
            <Text style={styles.buyText}>Already Enrolled</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.buyButtonWrapper}
            onPress={onVerifyWebinar}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.btnGradientStart, colors.btnGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyButton}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size={'small'} />
              ) : (
                <Text style={styles.buyText}>
                  Purchase for ₹{total.toFixed(2)}
                </Text>
              )}
            </LinearGradient>
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
    backgroundColor: colors.uBg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldDim,
    paddingVertical: hp(8),
    borderRadius: wp(8),
    marginHorizontal: wp(15),
    paddingHorizontal: wp(12),
    marginTop: hp(10),
    borderWidth: 1,
    borderColor: colors.gold,
    gap: wp(6),
  },
  countdownText: {
    color: colors.gold,
    fontSize: fp(14),
    fontWeight: '700',
  },

  thumbnailWrapper: {
    width: '100%',
    height: hp(220),
    backgroundColor: colors.uCard,
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
    color: colors.textPrimary,
    fontSize: fp(14),
  },

  title: {
    fontSize: fp(22),
    fontWeight: '700',
    marginTop: hp(15),
    paddingHorizontal: wp(15),
    color: colors.textPrimary,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(8),
    paddingHorizontal: wp(15),
    gap: wp(6),
  },
  host: {
    color: colors.textPrimary,
    fontSize: fp(14),
  },
  detailText: {
    color: colors.textPrimary,
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
    backgroundColor: colors.uCard,
    paddingVertical: hp(5),
    paddingHorizontal: wp(10),
    borderRadius: wp(20),
    gap: wp(4),
  },

  tagText: {
    color: colors.textPrimary,
    fontSize: fp(12),
  },

  priceBox: {
    backgroundColor: colors.uCard,
    padding: wp(16),
    borderRadius: wp(14),
    marginHorizontal: wp(15),
    borderWidth: 1,
    borderColor: colors.uSubtext,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(6),
  },
  priceLabel: {
    color: colors.uSubHeading,
    fontSize: fp(14),
  },
  priceValue: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: fp(14),
  },
  totalRow: {
    borderTopWidth: wp(1),
    borderColor: colors.uSubtext,
    marginTop: hp(12),
    paddingTop: hp(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary
  },
  totalValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.statText,
  },
  participants: {
    fontSize: fp(14),
    color: colors.textPrimary,
    marginTop: hp(10),
  },

  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '600',
    paddingHorizontal: wp(15),
    color: colors.textPrimary,
  },
  description: {
    fontSize: fp(14),
    color: colors.textPrimary,
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
    backgroundColor: colors.uBg,
    borderTopWidth: wp(1),
    borderColor: colors.uBg,
    marginBottom: hp(10),
  },
  buyButtonWrapper: {
    borderRadius: wp(12),
    overflow: 'hidden',
  },
  buyButton: {
    paddingVertical: hp(14),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(16),
  },
  policyText: {
    fontSize: fp(12),
    color: colors.uSubHeading,
    textAlign: 'center',
    lineHeight: fp(18),
    marginTop: hp(12),
    paddingHorizontal: wp(15),
  },
  policyLink: {
    color: colors.statText,
    fontWeight: '600',
  },
});
