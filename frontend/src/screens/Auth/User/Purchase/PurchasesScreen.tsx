import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../../../components/AppHeader';
import colors from '../../../../utils/colors';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import { getMyTransactions } from '../../../../store/PaymentSlice';
import ButtonSection from '../Products/component/ButtonSection';
import PurchaseCoursCard from './component/PurchaseCoursCard';
import PurchaseWebinarCard from './component/PurchaseWebinarCard';
import { getEnrolledWebinar } from '../../../../store/WebinarSlice';

const PurchasesScreen = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );
  const { transactions } = useSelector((state: any) => state.paymentReducer);

  const [active, setActive] = useState('courses');

  // Pagination states
  const [webinarData, setWebinarData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    funEnrolledAllWebinar(1, limit, true); // initial load
  }, []);

  // Fetch Webinars
  const funEnrolledAllWebinar = (
    pageNum: number,
    dataLimit: number,
    isRefresh = false,
  ) => {
    const payload = {
      page: pageNum,
      limit: dataLimit,
      upcoming: true,
    };

    dispatch(getEnrolledWebinar(payload))
      .unwrap()
      .then(response => {
        const newData = response?.data?.data?.enrollments || [];

        if (isRefresh) {
          setWebinarData(newData);
        } else {
          setWebinarData(prev => [...prev, ...newData]);
        }

        // Check if more data exists
        if (newData.length < dataLimit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setLoadingMore(false);
        setRefreshing(false);
      });
  };

  // Load more when end reached
  const loadMoreWebinars = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);

    funEnrolledAllWebinar(nextPage, limit);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    funEnrolledAllWebinar(1, limit, true);
  };

  const loadData = () => {
    dispatch(getEnrolledCourses({}));
    dispatch(getMyTransactions({ status: 'SUCCESS' }));
  };

  return (
    <View style={styles.container}>
      <AppHeader title="My Purchases" />

      <View style={{ marginTop: 10 }}>
        <ButtonSection setActive={setActive} active={active} />
      </View>

      {active === 'courses' ? (
        <FlatList
          data={enrolledCourses?.enrollments || []}
          keyExtractor={item =>
            item?.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const transaction = transactions?.find(
              (t: any) =>
                t?.course_id === item?.id || t?.enrollment_id === item?.id,
            );

            return (
              <PurchaseCoursCard
                item={item}
                transaction={transaction}
                onPress={() => navigation.navigate('UserVideoList', { item })}
              />
            );
          }}
        />
      ) : (
        <FlatList
          data={webinarData}
          keyExtractor={item => item?.id?.toString()}
          renderItem={({ item }) => <PurchaseWebinarCard item={item} />}
          onEndReached={loadMoreWebinars}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={{ padding: 20 }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default PurchasesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
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
});
