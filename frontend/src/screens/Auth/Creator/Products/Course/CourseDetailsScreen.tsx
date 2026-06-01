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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Play, CheckCircle } from 'lucide-react-native';

import colors from '../../../../../utils/colors';
import AiButton from '../../../../../components/AiButton';
import LandingCopyModal from '../../../../../components/ai/LandingCopyModal';
import { wp, hp, fp } from '../../../../../utils/responsive';
import AppHeaderWithBack from '../../../../../components/AppHeaderWithBack';
import { getCourseById } from '../../../../../store/CourseSlice';
import { createPaymentOrder, verifyPayment } from '../../../../../store/PaymentSlice';
import { getEnrolledCourses } from '../../../../../store/EnrollmentSlice';

const CourseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const [showLandingCopy, setShowLandingCopy] = useState(false);

  const courseId = route.params?.courseId || route.params?.id;

  const { current: course } = useSelector(
    (state: any) => state.coursesReducer
  );
  const { list: enrolledCourses } = useSelector(
    (state: any) => state.enrollmentsReducer
  );
  const { loading } = useSelector((state: any) => state.paymentReducer);
  const { user } = useSelector((state: any) => state.userReducer);

  const price = Number(course?.price || 0);
  const gst = (price * 18) / 100;
  const platformFee = (price * 2) / 100;
  const total = price + gst + platformFee;
  const amountInPaise = Math.round(total * 100);

  useEffect(() => {
    if (courseId) {
      dispatch(getCourseById(courseId));
      dispatch(getEnrolledCourses({}));
    }
  }, [courseId]);

  const isEnrolled = enrolledCourses?.enrollments?.some(
    (enrollment: any) => enrollment.course_id === courseId
  );

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
              <Users size={wp(18)} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.enrollments?.length || 0} students
              </Text>
            </View>

            <View style={styles.statItem}>
              <Play size={wp(18)} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.videos?.length || 0} videos
              </Text>
            </View>
          </View>

          <AiButton
            label="Suggest Landing Copy"
            onPress={() => setShowLandingCopy(true)}
            style={{ alignSelf: 'flex-start', marginTop: hp(8) }}
          />

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
              <Text style={styles.totalValue}>
                ₹{total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LandingCopyModal
        visible={showLandingCopy}
        onClose={() => setShowLandingCopy(false)}
        title={course?.title || ''}
        description={course?.description || ''}
        price={price}
      />
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
