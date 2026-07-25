import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TermsModal from '../../../components/TermsModal';
import PrivacyModal from '../../../components/PrivacyModal';
import RefundPolicyModal from '../../../components/RefundPolicyModal';
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Play, CheckCircle, BookOpen } from 'lucide-react-native';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFEnvironment,
  CFSession,
  CFDropCheckoutPayment,
  CFThemeBuilder,
} from 'cashfree-pg-api-contract';

import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import YouTubePlayer from '../../../components/YouTubePlayer';
import { getCourseById } from '../../../store/CourseSlice';
import { createPaymentOrder, verifyPayment } from '../../../store/PaymentSlice';
import { getEnrolledCourses } from '../../../store/EnrollmentSlice';
import NotificationService from '../../../services/NotificationService';
import LinearGradient from 'react-native-linear-gradient';

const CourseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const focus = useIsFocused();

  const courseId = route.params?.courseId;
  const videoList = route.params?.videoList || [];

  const { current: course } = useSelector((state: any) => state.coursesReducer);

  const { list: enrolledCourses } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );
  const { loading } = useSelector((state: any) => state.paymentReducer);
  const { user } = useSelector((state: any) => state.userReducer);
  const [purchasing, setPurchasing] = useState(false);
  const [courseLoading, setCourseLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const price = Number(course?.price || 0);
  const gst = (price * 18) / 100;
  const platformFee = (price * 2) / 100;
  const total = price + gst + platformFee;
  const amountInPaise = Math.round(total * 100);

  useEffect(() => {
    if (courseId) {
      setCourseLoading(true);
      Promise.all([
        dispatch(getCourseById(courseId))
          .unwrap()
          .then((res: any) => console.log('---success---', res))
          .catch((err: any) => console.log('---error---', err)),
        dispatch(getEnrolledCourses({})),
      ]).finally(() => setCourseLoading(false));
    }
  }, [courseId, focus]);

  const isEnrolled = enrolledCourses?.enrollments?.some(
    (enrollment: any) => enrollment.course_id === courseId,
  );

  // Store the pending order ID in a ref so the Cashfree callback can access it
  const pendingOrderRef = useRef<string | null>(null);

  // Register Cashfree callbacks once, clean up on unmount
  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify: async (orderIdFromSDK: string) => {
        const orderId = pendingOrderRef.current;
        if (!orderId) return;
        pendingOrderRef.current = null;

        try {
          await dispatch(verifyPayment({ order_id: orderId })).unwrap();
          await dispatch(getEnrolledCourses({}));

          NotificationService.displayNotification(
            'Course Purchased Successfully',
            `You have successfully enrolled in "${
              course?.title || 'your course'
            }". Start learning now!`,
            { type: 'course_purchase', courseId },
          );

          Alert.alert('Success', 'Course purchased successfully!', [
            {
              text: 'View My Courses',
              onPress: () =>
                navigation.navigate('UserBottomTab', {
                  screen: 'PurchasesScreen',
                }),
            },
            { text: 'OK' },
          ]);
        } catch (err: any) {
          Alert.alert(
            'Verification Failed',
            err?.message || 'Unable to verify payment',
          );
        } finally {
          setPurchasing(false);
        }
      },
      onError: (error: any, orderIdFromSDK: string) => {
        pendingOrderRef.current = null;
        const msg = error?.message || 'Something went wrong';
        if (error?.code === 'action_cancelled') {
          Alert.alert('Cancelled', 'Payment was cancelled');
        } else {
          Alert.alert('Payment Failed', msg);
        }
        setPurchasing(false);
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  const handlePurchase = async () => {
    if (!course) return;

    if (price === 0) {
      Alert.alert('Info', 'This is a free course. Feature coming soon!');
      return;
    }

    try {
      setPurchasing(true);

      // Step 1: Create order on backend
      const orderResponse = await dispatch(
        createPaymentOrder(courseId),
      ).unwrap();

      const { cashfree_order, cashfree_env } = orderResponse || {};

      if (!cashfree_order?.payment_session_id || !cashfree_order?.order_id) {
        throw new Error('Invalid payment order');
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
      Alert.alert('Payment Failed', error?.message || 'Something went wrong');
      setPurchasing(false);
    }
  };

  if (courseLoading || !course) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Course Details" bgColor={colors.uBg} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const showVideo = videoList[0]?.playback_url;

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Course Details" bgColor={colors.uBg} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {showVideo ? (
          <YouTubePlayer
            source={{ uri: showVideo }}
            title={''}
            autoPlay
            showCloseButton={false}
            style={styles.heroPlayer}
          />
        ) : (
          course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <BookOpen size={wp(44)} color={colors.uSubHeading} strokeWidth={1.2} />
              <Text style={styles.placeholderText}>{course.title || 'Course'}</Text>
            </View>
          )
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>

          {course.creator?.name && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CreatorPublicProfile', { creator: course.creator })}
              style={styles.instructorRow}
            >
              <Text style={styles.instructor}>by </Text>
              <Text style={styles.instructorName}>{course.creator.name}</Text>
            </TouchableOpacity>
          )}

          {course.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this course</Text>
              <Text style={styles.description}>{course.description}</Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={18} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.total_students || 0} students
              </Text>
            </View>

            <View style={styles.statItem}>
              <Play size={18} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.total_videos || course.videos?.length || 0} videos
              </Text>
            </View>
          </View>

          {/* PAYMENT DETAILS */}
          <View style={styles.priceBox}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            <PriceRow label="Course Fee" value={`₹${price}`} />
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
            <Text
              style={styles.policyLink}
              onPress={() => setShowPrivacy(true)}
            >
              Privacy Policy
            </Text>
            {' & '}
            <Text style={styles.policyLink} onPress={() => setShowRefund(true)}>
              Refund Policy
            </Text>
          </Text>
        </View>
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
      <RefundPolicyModal
        visible={showRefund}
        onClose={() => setShowRefund(false)}
      />

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <View style={styles.enrolledContainer}>
            <CheckCircle size={24} color={colors.primary} />
            <Text style={styles.enrolledText}>Already Enrolled</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.purchaseButtonWrapper,
              (purchasing || loading) && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={purchasing || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.btnGradientStart, colors.btnGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.purchaseButtonGradient}
            >
              {purchasing || loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.purchaseText}>
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

export default CourseDetailsScreen;

const PriceRow = ({ label, value }: any) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceLabel}>{label}</Text>
    <Text style={styles.priceValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.uBg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thumbnail: { width: '100%', height: hp(220), backgroundColor: colors.uCard },
  thumbnailPlaceholder: {
    width: '100%',
    height: hp(220),
    backgroundColor: colors.uCard,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(8),
  },
  placeholderText: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.uSubHeading,
    opacity: 0.6,
    paddingHorizontal: wp(30),
    textAlign: 'center',
  },
  heroPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 0,
  },
  content: { padding: wp(16) },
  title: { fontSize: fp(24), fontWeight: '700', color: colors.textPrimary },
  instructorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(16) },
  instructor: { color: colors.textSecondary, fontSize: fp(14) },
  instructorName: { color: colors.uBottomText, fontSize: fp(14), fontWeight: '600', textDecorationLine: 'underline' },
  section: { marginVertical: hp(16) },
  sectionTitle: { fontSize: fp(18), fontWeight: '600', marginBottom: hp(10), color: colors.textPrimary },
  description: { fontSize: fp(15), lineHeight: fp(22), color: colors.textSecondary },
  statsContainer: { flexDirection: 'row', gap: wp(16), marginVertical: hp(12) },
  statItem: { flexDirection: 'row', gap: wp(6), alignItems: 'center' },
  statText: { color: colors.textSecondary },

  priceBox: {
    backgroundColor: colors.uCard,
    padding: wp(16),
    borderRadius: wp(12),
    marginTop: hp(20),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(6),
  },
  priceLabel: { color: colors.uSubHeading },
  priceValue: { fontWeight: '600', color: colors.textPrimary },

  totalRow: {
    borderTopWidth: wp(1),
    borderColor: colors.border,
    marginTop: hp(10),
    paddingTop: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: fp(16), fontWeight: '700' , color: colors.textPrimary},
  totalValue: { fontSize: fp(18), fontWeight: '800', color: colors.uBottomText },

  bottomBar: {
    padding: wp(16),
    borderTopWidth: wp(1),
    borderColor: colors.border,
  },
  // --- Updated Button Styles ---
  purchaseButtonWrapper: {
    borderRadius: wp(12),
    overflow: 'hidden', // Ensures gradient respects the border radius
  },
  purchaseButtonGradient: {
    paddingVertical: hp(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButton: {
    backgroundColor: colors.info,
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: 'center',
  },
  purchaseButtonDisabled: { opacity: 0.6 },
  purchaseText: { color: colors.white, fontSize: fp(16), fontWeight: '700' },

  enrolledContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(8),
  },
  enrolledText: { color: colors.info, fontWeight: '700' },

  policyText: {
    fontSize: fp(12),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(18),
    marginTop: hp(12),
  },
  policyLink: {
    color: colors.uBottomText,
    fontWeight: '500',
  },
});
