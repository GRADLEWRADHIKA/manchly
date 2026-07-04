import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  UIManager,
} from 'react-native';
import {
  ShoppingBag,
  Menu,
  Bell,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import { getMyTransactions } from '../../../../store/PaymentSlice';
import PurchaseCoursCard from './component/PurchaseCoursCard';
import { getEnrolledWebinar } from '../../../../store/WebinarSlice';
import { wp, hp, fp } from '../../../../utils/responsive';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Mock Data (remove once API is fully wired) ──────────────────────────────
const MOCK_COURSES = [
  {
    id: 'm1',
    archived: false,
    progress: 32,
    time_spent: '4h',
    total_duration: '12h 40m',
    course: {
      title: 'Advanced Quantum Computing Architectures',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
      modules: [
        { title: 'Module 3: Qubit Entanglement', completed: true },
        { title: 'Current Module 4/12 - Error Correction Protocols', completed: false },
        { title: 'Module 5: Quantum Gates', completed: false },
      ],
    },
  },
  {
    id: 'm2',
    archived: false,
    progress: 68,
    time_spent: '5h',
    total_duration: '8h 10m',
    course: {
      title: 'Efficient Data Structures in C++',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      modules: [
        { title: 'Best-Fit Binary Tree Balancing', completed: true },
        { title: 'Heaps & Priority Queues', completed: false },
      ],
    },
  },
  {
    id: 'm3',
    archived: false,
    progress: 15,
    time_spent: '1h',
    total_duration: '6h 30m',
    course: {
      title: 'Cinematic Lighting Theory',
      thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800',
      modules: [
        { title: 'Three-Point Setup', completed: false },
        { title: 'Color Temperature Basics', completed: false },
      ],
    },
  },
  {
    id: 'm4',
    archived: false,
    progress: 5,
    time_spent: '20m',
    total_duration: '5h 45m',
    course: {
      title: 'Neural Network Optimization',
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
      modules: [
        { title: 'Gradient Descent Variants', completed: false },
      ],
    },
  },
  {
    id: 'm5',
    archived: true,
    progress: 62,
    time_spent: '5h 30m',
    total_duration: '10h',
    course: {
      title: 'Legacy Data Science 1.0',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
      modules: [],
    },
  },
  {
    id: 'm6',
    archived: true,
    progress: 18,
    time_spent: '2h 15m',
    total_duration: '12h',
    course: {
      title: 'Introduction to Web3',
      thumbnail: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800',
      modules: [],
    },
  },
  {
    id: 'm7',
    archived: true,
    progress: 91,
    time_spent: '7h 45m',
    total_duration: '8h 30m',
    course: {
      title: 'Strategic Thinking 101',
      thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      modules: [],
    },
  },
  {
    id: 'm8',
    archived: false,
    progress: 100,
    completed_at: '2026-06-13',
    total_duration: '12h 40m',
    course: {
      title: 'Mastering Lit Motion Design',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
      modules: [],
    },
  },
  {
    id: 'm9',
    archived: false,
    progress: 100,
    completed_at: '2026-05-28',
    total_duration: '24h 10m',
    course: {
      title: 'Advanced Python Analytics',
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      modules: [],
    },
  },
  {
    id: 'm10',
    archived: false,
    progress: 100,
    completed_at: '2026-05-10',
    total_duration: '9h 30m',
    course: {
      title: 'Generative AI for Product Teams',
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
      modules: [],
    },
  },
  {
    id: 'm11',
    archived: false,
    progress: 100,
    completed_at: '2026-04-22',
    total_duration: '13h 20m',
    course: {
      title: 'Cognitive Design Principles',
      thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800',
      modules: [],
    },
  },
];

const TAB_OPTIONS = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'archived', label: 'Archived' },
  { key: 'completed', label: 'Completed' },
];

const SegmentedTabs = ({ active, setActive }: any) => (
  <View style={tabStyles.wrapper}>
    <View style={tabStyles.track}>
      {TAB_OPTIONS.map(tab => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => setActive(tab.key)}
            style={tabStyles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={tabStyles.underline} />}
          </Pressable>
        );
      })}
    </View>
  </View>
);

const tabStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  track: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(10),
    position: 'relative',
  },
  label: {
    fontSize: fp(14),
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
});

const EmptyState = ({ type }: { type: string }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconCircle}>
      <ShoppingBag size={wp(32)} color={colors.gold} strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyText}>
      {type === 'ongoing'
        ? 'No Active Courses'
        : type === 'archived'
        ? 'No Archived Courses'
        : 'No Completed Courses'}
    </Text>
    <Text style={styles.emptySubtext}>
      {type === 'ongoing'
        ? 'Your enrolled courses will appear here'
        : type === 'archived'
        ? 'Archived courses will appear here'
        : 'Completed courses will appear here'}
    </Text>
  </View>
);

const PurchasesScreen = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );
  const { transactions } = useSelector((state: any) => state.paymentReducer);

  const [active, setActive] = useState('ongoing');
  const [webinarData, setWebinarData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadData();
    funEnrolledAllWebinar(1, limit, true);
  }, []);

  const funEnrolledAllWebinar = (
    pageNum: number,
    dataLimit: number,
    isRefresh = false,
  ) => {
    const payload = { page: pageNum, limit: dataLimit, upcoming: true };
    dispatch(getEnrolledWebinar(payload))
      .unwrap()
      .then((response: any) => {
        const newData = response?.data?.data?.enrollments || [];
        if (isRefresh) {
          setWebinarData(newData);
        } else {
          setWebinarData(prev => [...prev, ...newData]);
        }
        setHasMore(newData.length >= dataLimit);
        setLoadingMore(false);
        setRefreshing(false);
      });
  };

  const loadData = () => {
    dispatch(getEnrolledCourses({}));
    dispatch(getMyTransactions({ status: 'SUCCESS' }));
  };

  const onRefreshCourses = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Fall back to mock data when the store has nothing yet.
  // TODO: remove the MOCK_COURSES fallback once the API reliably returns data.
  const courseData = enrolledCourses?.enrollments?.length
    ? enrolledCourses.enrollments
    : MOCK_COURSES;

  const ongoingCourses = courseData.filter((item: any) => !item.archived && item.progress < 100);
  const archivedCourses = courseData.filter((item: any) => item.archived);
  const completedCourses = courseData.filter((item: any) => item.progress === 100);

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <Menu size={22} color={colors.textPrimary} />
        <Text style={styles.headerTitle}>Manchly</Text>
        <Bell size={22} color={colors.textPrimary} />
      </View>

      <SegmentedTabs active={active} setActive={setActive} />

      {active === 'ongoing' && (
        <FlatList
          data={ongoingCourses}
          keyExtractor={item => item?.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState type="ongoing" />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshCourses}
              colors={[colors.gold]}
              tintColor={colors.gold}
            />
          }
          renderItem={({ item, index }) => {
            const transaction = transactions?.find(
              (t: any) =>
                t?.course_id === item?.id || t?.enrollment_id === item?.id,
            );
            return (
              <PurchaseCoursCard
                item={item}
                transaction={transaction}
                variant="ongoing"
                isFeatured={index === 0}
                onPress={() => navigation.navigate('UserVideoList', { item })}
              />
            );
          }}
        />
      )}

      {active === 'archived' && (
        <FlatList
          data={archivedCourses}
          keyExtractor={item => item?.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState type="archived" />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshCourses}
              colors={[colors.gold]}
              tintColor={colors.gold}
            />
          }
          renderItem={({ item }) => (
            <PurchaseCoursCard
              item={item}
              variant="archived"
              onPress={() => navigation.navigate('UserVideoList', { item })}
            />
          )}
        />
      )}

      {active === 'completed' && (
        <FlatList
          data={completedCourses}
          keyExtractor={item => item?.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState type="completed" />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshCourses}
              colors={[colors.gold]}
              tintColor={colors.gold}
            />
          }
          renderItem={({ item }) => (
            <PurchaseCoursCard
              item={item}
              variant="completed"
              onPress={() => navigation.navigate('UserVideoList', { item })}
            />
          )}
        />
      )}
    </View>
  );
};

export default PurchasesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(12),
    backgroundColor: colors.bg,
  },
  headerTitle: {
    color: colors.gold,
    fontSize: fp(18),
    fontWeight: '700',
  },
  listContent: {
    padding: wp(16),
    paddingBottom: hp(120),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(40),
    paddingTop: hp(80),
  },
  emptyIconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fp(17),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(6),
    textAlign: 'center',
    lineHeight: fp(19),
  },
});