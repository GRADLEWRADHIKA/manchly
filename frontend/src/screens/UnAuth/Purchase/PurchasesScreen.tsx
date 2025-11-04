// PurchasesScreen.tsx
import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { CalendarClock, Video, GraduationCap, Plus, ShoppingBag } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../../components/AppHeader';
import colors from '../../../utils/colors';
import { getEnrolledCourses } from '../../../store/EnrollmentSlice';
import { getMyTransactions } from '../../../store/PaymentSlice';

const formatINR = (value: any) =>
  typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value;

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

const PurchasesScreen = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();

  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer
  );
  const { transactions, loading: transactionsLoading } = useSelector(
    (state: any) => state.paymentReducer
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(getEnrolledCourses({}));
    dispatch(getMyTransactions({ status: 'SUCCESS' }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleViewCourse = (courseId: string) => {
    navigation.navigate('CourseDetailsScreen', { courseId });
  };
  if (enrolledLoading && !enrolledCourses?.length) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Purchases" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your purchases...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="My Purchases" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {enrolledCourses && enrolledCourses.length > 0 ? (
          enrolledCourses.map((enrollment: any) => {
            const courseId = enrollment.id || enrollment._id || enrollment.course_id;
            const courseTitle = enrollment.title || enrollment.course_title || 'Untitled Course';
            const enrolledDate = enrollment.enrolled_at || enrollment.created_at;
            const progress = enrollment.progress || 0;
            
            // Find transaction for this enrollment
            const transaction = transactions?.find(
              (t: any) => 
                t.course_id === courseId || 
                t.enrollment_id === enrollment.id
            );

            return (
              <View key={courseId} style={styles.card}>
                {/* Header: Icon + Title */}
                <View style={styles.cardHeader}>
                  <GraduationCap size={20} color={colors.primary} />
                  <Text style={styles.title} numberOfLines={2}>
                    {courseTitle}
                  </Text>
                </View>

                {/* Meta: Type, Date */}
                <View style={styles.meta}>
                  <Text style={styles.type}>Course</Text>
                  {enrolledDate && (
                    <Text style={styles.date}>
                      Enrolled: {formatDate(enrolledDate)}
                    </Text>
                  )}
                </View>

                {/* Price row */}
                {transaction && (
                  <View style={styles.priceRow}>
                    <Text style={styles.purchasedFor}>Purchased for</Text>
                    <Text style={styles.priceValue}>
                      {formatINR(transaction.amount)}
                    </Text>
                  </View>
                )}

                {/* Progress Bar */}
                {progress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {transaction && (
                  <View style={styles.historyBox}>
                    <Text style={styles.historyTitle}>Payment Details</Text>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyDate}>Transaction ID</Text>
                      <Text style={styles.historyPrice} numberOfLines={1}>
                        {transaction.id || transaction._id || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.historyRow}>
                      <Text style={styles.historyDate}>Status</Text>
                      <Text
                        style={[
                          styles.historyPrice,
                          { color: transaction.status === 'SUCCESS' ? 'green' : colors.text },
                        ]}
                      >
                        {transaction.status || 'N/A'}
                      </Text>
                    </View>
                    {transaction.razorpay_payment_id && (
                      <View style={styles.historyRow}>
                        <Text style={styles.historyDate}>Payment ID</Text>
                        <Text style={styles.historyPrice} numberOfLines={1}>
                          {transaction.razorpay_payment_id}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

            
                <View style={styles.footer}>
                  <Text style={[styles.status, styles.completed]}>
                    {progress === 100 ? 'Completed' : 'In Progress'}
                  </Text>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.8}
                    onPress={() => handleViewCourse(courseId)}
                  >
                    <Text style={styles.actionText}>
                      {progress === 100 ? 'Review' : 'Continue Learning'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={60} color={colors.textSecondary} />
            <Text style={styles.emptyText}>You haven't purchased any courses yet.</Text>
            <Text style={styles.emptySubtext}>
              Browse our courses and start learning today!
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate('ProductsScreen')}
            >
              <Text style={styles.browseText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PurchasesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },

  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginLeft: 8,
  },

  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  type: {
    fontSize: 13,
    color: '#777',
  },
  date: {
    fontSize: 13,
    color: '#777',
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchasedFor: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },

  historyBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f3f3f3',
  },
  historyDate: { color: '#666' },
  historyPrice: { fontWeight: '700', color: '#222' },
  historyEmpty: { color: '#888' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
  completed: { color: 'green' },
  upcoming: { color: colors.primary },
  scheduled: { color: '#E68A00' },

  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },

  progressContainer: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
  },
  browseText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
