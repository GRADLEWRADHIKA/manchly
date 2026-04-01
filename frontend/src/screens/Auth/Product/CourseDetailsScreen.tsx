import React, { useEffect, useState } from 'react';
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
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Play, CheckCircle } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';

import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { getCourseById } from '../../../store/CourseSlice';
import { createPaymentOrder, verifyPayment } from '../../../store/PaymentSlice';
import { getEnrolledCourses } from '../../../store/EnrollmentSlice';

const CourseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const focus = useIsFocused()

  const courseId = route.params?.courseId;

  const { current: course } = useSelector(
    (state: any) => state.coursesReducer
  );
  const { list: enrolledCourses } = useSelector(
    (state: any) => state.enrollmentsReducer
  );
  const { loading } = useSelector((state: any) => state.paymentReducer);
  const { user } = useSelector((state: any) => state.userReducer);

  const [purchasing, setPurchasing] = useState(false);

  const price = Number(course?.price || 0);
  const gst = (price * 18) / 100;
  const platformFee = (gst * 5) / 100;
  const total = price + gst + platformFee;
  const amountInPaise = Math.round(total * 100);

  useEffect(() => {
    if (courseId) {
      dispatch(getCourseById(courseId));
      dispatch(getEnrolledCourses({}));
    }
  }, [courseId, focus]);

  const isEnrolled = enrolledCourses?.enrollments?.some(
    (enrollment: any) => enrollment.course_id === courseId
  );

  const handlePurchase = async () => {
    if (!course) return;

    if (price === 0) {
      Alert.alert('Info', 'This is a free course. Feature coming soon!');
      return;
    }

    try {
      setPurchasing(true);

      const orderResponse = await dispatch(
        createPaymentOrder(courseId)
      ).unwrap();

      const { razorpay_order, razorpay_key_id, user_details } =
        orderResponse || {};

      if (!razorpay_order || !razorpay_key_id) {
        throw new Error('Invalid payment order');
      }

      /** 2️⃣ Razorpay options */
      const options = {
        description: course.title,
        image: course.thumbnail || '',
        currency: 'INR',
        key: razorpay_key_id,
        amount: amountInPaise,
        name: 'Manchly',
        order_id: razorpay_order.id,
        prefill: {
          email: user_details?.email || user?.email || '',
          contact: user_details?.phone || user?.phone || '',
          name:
            user_details?.name ||
            user?.name ||
            user?.full_name ||
            '',
        },
        theme: { color: colors.primary },
      };

      /** 3️⃣ Open Razorpay */
      const paymentResult = await RazorpayCheckout.open(options);

      /** 4️⃣ Verify payment */
      await dispatch(
        verifyPayment({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
        })
      ).unwrap();

      /** 5️⃣ Refresh enrollments */
      await dispatch(getEnrolledCourses({}));

      Alert.alert(
        'Success 🎉',
        'Course purchased successfully!',
        [
          {
            text: 'View My Courses',
            onPress: () =>
              navigation.navigate('UserBottomTab', {
                screen: 'PurchasesScreen',
              }),
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      if (error?.code === 2) {
        Alert.alert('Cancelled', 'Payment was cancelled');
      } else {
        Alert.alert(
          'Payment Failed',
          error?.message || 'Something went wrong'
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  /** ---------------- LOADING ---------------- */
  if (!course) {
    return (
      <View style={styles.container}>
        <AppHeaderWithBack title="Course Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Course Details" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {course.thumbnail && (
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.thumbnail}
          />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>

          {course.creator?.name && (
            <Text style={styles.instructor}>
              by {course.creator.name}
            </Text>
          )}

          {course.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                About this course
              </Text>
              <Text style={styles.description}>
                {course.description}
              </Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={18} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.enrollments?.length || 0} students
              </Text>
            </View>

            <View style={styles.statItem}>
              <Play size={18} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.videos?.length || 0} videos
              </Text>
            </View>
          </View>

          {/* PAYMENT DETAILS */}
          <View style={styles.priceBox}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            <PriceRow label="Course Fee" value={`₹${price}`} />
            <PriceRow label="GST (18%)" value={`₹${gst.toFixed(2)}`} />
            <PriceRow
              label="Platform Fee (5%)"
              value={`₹${platformFee.toFixed(2)}`}
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <View style={styles.enrolledContainer}>
            <CheckCircle size={24} color={colors.primary} />
            <Text style={styles.enrolledText}>
              Already Enrolled
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (purchasing || loading) &&
              styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={purchasing || loading}
          >
            {purchasing || loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.purchaseText}>
                Purchase for ₹{total.toFixed(2)}
              </Text>
            )}
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
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thumbnail: { width: '100%', height: hp(220) },
  content: { padding: wp(16) },
  title: { fontSize: fp(24), fontWeight: '700', color: colors.text },
  instructor: { color: colors.textSecondary, marginBottom: hp(16) },
  section: { marginVertical: hp(16) },
  sectionTitle: { fontSize: fp(18), fontWeight: '600', marginBottom: hp(10) },
  description: { fontSize: fp(15), lineHeight: fp(22) },
  statsContainer: { flexDirection: 'row', gap: wp(16), marginVertical: hp(12) },
  statItem: { flexDirection: 'row', gap: wp(6), alignItems: 'center' },
  statText: { color: colors.textSecondary },

  priceBox: {
    backgroundColor: colors.surface,
    padding: wp(16),
    borderRadius: wp(12),
    marginTop: hp(20),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(6),
  },
  priceLabel: { color: colors.textSecondary },
  priceValue: { fontWeight: '600' },

  totalRow: {
    borderTopWidth: wp(1),
    borderColor: colors.border,
    marginTop: hp(10),
    paddingTop: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: fp(16), fontWeight: '700' },
  totalValue: { fontSize: fp(18), fontWeight: '800', color: colors.primary },

  bottomBar: {
    padding: wp(16),
    borderTopWidth: wp(1),
    borderColor: colors.border,
  },
  purchaseButton: {
    backgroundColor: colors.secPrimary,
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
  enrolledText: { color: colors.primary, fontWeight: '700' },
});
