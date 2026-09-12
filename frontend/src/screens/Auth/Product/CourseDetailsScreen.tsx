import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
import {
  Users,
  Play,
  CheckCircle,
  BookOpen,
  BarChart3,
  Video,
  Clock,
  IndianRupee,
} from 'lucide-react-native';
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
import { buildWatermark } from '../../../utils/watermark';
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
  const watermarkText = useMemo(() => buildWatermark(course?.creator), [course?.creator]);
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

          navigation.navigate('PurchaseThankYou', {
            productType: 'course',
            title: course?.title,
            whatsappUrl: course?.whatsapp_community_url,
            message: course?.thankyou_message,
            contentRoute: 'PurchasesScreen',
          });
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

    try {
      setPurchasing(true);

      // Step 1: Create order on backend. For free courses the backend enrolls
      // the user immediately and returns no Cashfree order.
      const orderResponse = await dispatch(
        createPaymentOrder(courseId),
      ).unwrap();

      const { cashfree_order, cashfree_env } = orderResponse || {};

      // Free course → enrolled server-side, no payment step needed.
      if (!cashfree_order) {
        await dispatch(getEnrolledCourses({}));

        NotificationService.displayNotification(
          'Course Enrolled Successfully',
          `You have successfully enrolled in "${
            course?.title || 'your course'
          }". Start learning now!`,
          { type: 'course_purchase', courseId },
        );

        setPurchasing(false);
        navigation.navigate('PurchaseThankYou', {
          productType: 'course',
          title: course?.title,
          whatsappUrl: course?.whatsapp_community_url,
          message: course?.thankyou_message,
          contentRoute: 'PurchasesScreen',
        });
        return;
      }

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
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </View>
    );
  }

  const showVideo = videoList[0]?.playback_url;
  const videos = (course?.videos || [])
    .slice()
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const videoCount = course.total_videos || videos.length || 0;
  const ACCENT = colors.btnGradientStart;

  const formatDuration = (seconds: number) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const totalDuration = videos.reduce(
    (sum: number, v: any) => sum + (Number(v.duration) || 0),
    0,
  );

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Course Details" bgColor={colors.uBg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          {showVideo ? (
            <YouTubePlayer
              source={{ uri: showVideo }}
              title={''}
              autoPlay
              showCloseButton={false}
              style={styles.heroPlayer}
              watermark={isEnrolled ? watermarkText : undefined}
            />
          ) : course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailFallback}>
              <BookOpen size={wp(40)} color={ACCENT} strokeWidth={1.5} />
              <Text style={styles.thumbnailFallbackText}>No thumbnail</Text>
            </View>
          )}
          {!showVideo && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.thumbnailGradient}
            />
          )}
          {videoCount > 0 && !showVideo && (
            <View style={styles.playBadge}>
              <Play size={wp(14)} color="#fff" fill="#fff" />
              <Text style={styles.playBadgeText}>
                {videoCount} Lesson{videoCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Course Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.courseTitle}>{course.title}</Text>

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
            <Text style={styles.courseDesc}>{course.description}</Text>
          )}

          {/* Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BarChart3 size={wp(14)} color={ACCENT} />
              <Text style={styles.metaText}>{course?.level || 'Beginner'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Video size={wp(14)} color={ACCENT} />
              <Text style={styles.metaText}>{videoCount} Videos</Text>
            </View>
            {totalDuration > 0 && (
              <View style={styles.metaItem}>
                <Clock size={wp(14)} color={ACCENT} />
                <Text style={styles.metaText}>{formatDuration(totalDuration)}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Users size={wp(14)} color={ACCENT} />
              <Text style={styles.metaText}>{course.total_students || 0} Students</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <IndianRupee size={wp(16)} color={ACCENT} />
            <Text style={styles.priceText}>
              {price > 0 ? `${price.toLocaleString('en-IN')}` : 'Free'}
            </Text>
          </View>
        </View>

        {/* Course Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Course Summary</Text>
          <SummaryRow label="Title" value={course?.title || '--'} />
          <SummaryRow label="Level" value={course?.level || 'Beginner'} />
          <SummaryRow
            label="Price"
            value={price > 0 ? `Rs. ${price.toLocaleString('en-IN')}` : 'Free'}
          />
          <SummaryRow label="Videos" value={String(videoCount)} />
          {totalDuration > 0 && (
            <SummaryRow label="Duration" value={formatDuration(totalDuration)} />
          )}
          <SummaryRow
            label="Access"
            value={
              course?.access_duration_days
                ? `${course.access_duration_days} ${course.access_duration_unit || 'days'}`
                : 'Lifetime'
            }
            last
          />
        </View>

        {/* Course Content */}
        {videos.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Course Content</Text>
            {videos.map((v: any, i: number) => (
              <View
                key={v.id || i}
                style={[
                  styles.videoRow,
                  i < videos.length - 1 && styles.videoRowBorder,
                ]}
              >
                <View style={styles.videoOrderBadge}>
                  <Text style={styles.videoOrderText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {v.title || `Lesson ${i + 1}`}
                  </Text>
                  {v.duration > 0 && (
                    <Text style={styles.videoDuration}>
                      {formatDuration(v.duration)}
                    </Text>
                  )}
                </View>
                {v.is_free && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Payment Details */}
        {!isEnrolled && price > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Payment Details</Text>
            <SummaryRow label="Course Fee" value={`₹${price}`} />
            <SummaryRow label="GST (18%)" value={`₹${gst.toFixed(2)}`} />
            <SummaryRow label="Platform Fee (2%)" value={`₹${platformFee.toFixed(2)}`} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Policy Text */}
        {!isEnrolled && (
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
        )}
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <RefundPolicyModal visible={showRefund} onClose={() => setShowRefund(false)} />

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <View style={styles.enrolledContainer}>
            <CheckCircle size={wp(20)} color={colors.creatorGreen} />
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
              colors={['#86EFAC', '#4ADE80']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
              style={styles.purchaseButtonGradient}
            >
              {purchasing || loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.purchaseText}>
                  {price > 0 ? `Purchase for ₹${total.toFixed(2)}` : 'Enroll for Free'}
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

const SummaryRow = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.user.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: wp(16), paddingBottom: hp(24) },

  // Thumbnail
  thumbnailWrap: {
    borderRadius: wp(16),
    overflow: 'hidden',
    backgroundColor: colors.uCard,
    marginBottom: hp(14),
  },
  thumbnail: { width: '100%', aspectRatio: 16 / 9 },
  heroPlayer: { width: '100%', aspectRatio: 16 / 9, borderRadius: 0 },
  thumbnailFallback: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.uCard,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(8),
  },
  thumbnailFallbackText: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.4)',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  playBadge: {
    position: 'absolute',
    bottom: wp(12),
    left: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  playBadgeText: { fontSize: fp(11), fontWeight: '600', color: '#FFFFFF' },

  // Info Card
  infoCard: {
    backgroundColor: colors.uCard,
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: colors.uSubtext,
  },
  courseTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: hp(4),
  },
  instructorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(10) },
  instructor: { color: 'rgba(255,255,255,0.6)', fontSize: fp(13) },
  instructorName: {
    color: colors.uBottomText,
    fontSize: fp(13),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  courseDesc: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(20),
    marginBottom: hp(14),
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(14),
    marginBottom: hp(12),
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: wp(5) },
  metaText: { fontSize: fp(12), color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingTop: hp(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  priceText: { fontSize: fp(20), fontWeight: '800', color: colors.btnGradientStart },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.uCard,
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: colors.uSubtext,
  },
  cardTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp(8),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(10),
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  summaryLabel: { fontSize: fp(12), color: 'rgba(255,255,255,0.5)' },
  summaryValue: { fontSize: fp(12), fontWeight: '700', color: '#FFFFFF' },

  // Total row
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: hp(8),
    paddingTop: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: fp(14), fontWeight: '700', color: colors.textPrimary },
  totalValue: { fontSize: fp(16), fontWeight: '800', color: colors.btnGradientStart },

  // Video list
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  videoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  videoOrderBadge: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(90,104,243,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  videoOrderText: { fontSize: fp(12), fontWeight: '700', color: colors.btnGradientStart },
  videoTitle: { fontSize: fp(13.5), fontWeight: '600', color: '#FFFFFF' },
  videoDuration: { fontSize: fp(11), color: 'rgba(255,255,255,0.45)', marginTop: hp(2) },
  freeBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  freeBadgeText: { fontSize: fp(9), fontWeight: '700', color: '#34D399' },

  // Bottom bar
  bottomBar: {
    padding: wp(16),
    borderTopWidth: 1,
    borderTopColor: colors.uSubtext,
    backgroundColor: colors.uBg,
  },
  purchaseButtonWrapper: { borderRadius: wp(14), overflow: 'hidden' },
  purchaseButtonGradient: {
    paddingVertical: hp(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: { opacity: 0.6 },
  purchaseText: { color: colors.white, fontSize: fp(16), fontWeight: '700' },
  enrolledContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(8),
    paddingVertical: hp(4),
  },
  enrolledText: { color: colors.creatorGreen, fontWeight: '700', fontSize: fp(15) },

  policyText: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: fp(17),
    marginTop: hp(4),
    marginBottom: hp(8),
  },
  policyLink: { color: colors.uBottomText, fontWeight: '500' },
});
