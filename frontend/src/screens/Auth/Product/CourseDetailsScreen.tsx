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
import { Users, Clock, Play, CheckCircle } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import colors from '../../../utils/colors';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import { getCourseById } from '../../../store/CourseSlice';
import { createPaymentOrder, verifyPayment } from '../../../store/PaymentSlice';
import { getEnrolledCourses } from '../../../store/EnrollmentSlice';

const CourseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();

  const courseId = route.params?.courseId;
  const { current: course } = useSelector((state: any) => state.coursesReducer);
  const { list: enrolledCourses } = useSelector(
    (state: any) => state.enrollmentsReducer
  );
  const { loading } = useSelector((state: any) => state.paymentReducer);
  const { user } = useSelector((state: any) => state.userReducer);

  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (courseId) {
      dispatch(getCourseById(courseId));
      dispatch(getEnrolledCourses({}));
    }
    
    // Debug: Check if Razorpay module is loaded
    console.log('RazorpayCheckout module loaded:', RazorpayCheckout !== null);
    console.log('RazorpayCheckout:', RazorpayCheckout);
  }, [courseId]);

  // Check if user is already enrolled
  const isEnrolled = enrolledCourses.enrollments?.some((enrollment: any) => enrollment.course_id === courseId);
//     (c: any) => (c.id || c._id || c.course_id) === courseId
//   );

  const handlePurchase = async () => {
    if (!course) return;

    // If course is free, enroll directly
    if (course.price === 0) {
      Alert.alert('Info', 'This is a free course. Feature coming soon!');
      return;
    }

    try {
      setPurchasing(true);

      // Step 1: Create Razorpay order
      const orderResponse = await dispatch(createPaymentOrder(courseId)).unwrap();
      
      console.log('Order Response:', orderResponse);

      // Extract data from response
      const razorpay_order = orderResponse?.razorpay_order;
      const razorpay_key_id = orderResponse?.razorpay_key_id;
      const user_details = orderResponse?.user_details;
      const course_details = orderResponse?.course_details;

      // Validate required data
      if (!razorpay_order || !razorpay_key_id) {
        throw new Error('Invalid order response from server');
      }

      // Step 2: Open Razorpay Checkout
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

      console.log('Razorpay Options:', options);

      const paymentResult = await RazorpayCheckout.open(options);
      
      console.log('Payment Result:', paymentResult);

      // Step 3: Verify payment on backend
      await dispatch(
        verifyPayment({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
        })
      ).unwrap();

      // Success - refresh enrolled courses
      await dispatch(getEnrolledCourses({}));

      Alert.alert(
        'Success! 🎉',
        'Course purchased successfully! You can now access all course content.',
        [
          {
            text: 'View My Courses',
            onPress: () => {
              // Navigate to the Purchases tab in UserBottomTab
              navigation.navigate('UserBottomTab', { 
                screen: 'PurchasesScreen' 
              });
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      if (error.code === 2) {
        // Payment cancelled by user
        Alert.alert('Cancelled', 'Payment was cancelled');
      } else {
        Alert.alert(
          'Payment Failed',
          error.message || 'Something went wrong. Please try again.'
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Course Thumbnail */}
        {course.thumbnail && (
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Title and Instructor */}
          <Text style={styles.title}>{course.title}</Text>
          {course.creator?.name && (
            <Text style={styles.instructor}>by {course.creator.name}</Text>
          )}

          {/* Description */}
          {course.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this course</Text>
              <Text style={styles.description}>{course.description}</Text>
            </View>
          )}

          {/* Course Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={18} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.enrollments?.length || 0} students
              </Text>
            </View>
            
            {course.level && (
              <View style={styles.statItem}>
                <CheckCircle size={18} color={colors.textSecondary} />
                <Text style={styles.statText}>{course.level}</Text>
              </View>
            )}
            
            <View style={styles.statItem}>
              <Play size={18} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {course.videos?.length || 0} videos
              </Text>
            </View>
          </View>

          {/* What you'll learn */}
          {course.what_you_will_learn &&
            Array.isArray(course.what_you_will_learn) &&
            course.what_you_will_learn.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What you'll learn</Text>
                {course.what_you_will_learn.map((item: string, index: number) => (
                  <View key={index} style={styles.learningItem}>
                    <CheckCircle size={16} color={colors.primary} />
                    <Text style={styles.learningText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

          {/* Prerequisites */}
          {course.prerequisites &&
            Array.isArray(course.prerequisites) &&
            course.prerequisites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prerequisites</Text>
                {course.prerequisites.map((item: string, index: number) => (
                  <View key={index} style={styles.learningItem}>
                    <CheckCircle size={16} color={colors.textSecondary} />
                    <Text style={styles.learningText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>
              {course.price === 0 ? 'Free' : `₹${course.price}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <View style={styles.enrolledContainer}>
            <CheckCircle size={24} color={colors.primary} />
            <Text style={styles.enrolledText}>Already Enrolled</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (purchasing || loading) && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={purchasing || loading}
          >
            {purchasing || loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {course.price === 0
                  ? 'Enroll for Free'
                  : `Purchase for ₹${course.price}`}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CourseDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  thumbnail: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  instructor: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  learningText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  priceSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  enrolledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  enrolledText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

