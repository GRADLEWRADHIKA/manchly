import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import {
  ShoppingBag,
  GraduationCap,
  Video,
  Instagram,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import { getMyTransactions } from '../../../../store/PaymentSlice';
import PurchaseCoursCard from './component/PurchaseCoursCard';
import PurchaseWebinarCard from './component/PurchaseWebinarCard';
import { getEnrolledWebinar } from '../../../../store/WebinarSlice';
import { wp, hp, fp } from '../../../../utils/responsive';
import { LinearGradient } from 'react-native-linear-gradient';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TAB_OPTIONS = [
  { key: 'courses', label: 'Courses', Icon: GraduationCap },
  { key: 'webinar', label: 'Webinars', Icon: Video },
];

/* ──────────────── Segmented Tab Control ──────────────── */
const SegmentedTabs = ({
  active,
  setActive,
  courseCount,
  webinarCount,
}: any) => {
  const slideAnim = useRef(new Animated.Value(active === 'courses' ? 0 : 1))
    .current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: active === 'courses' ? 0 : 1,
      useNativeDriver: true,
      friction: 10,
      tension: 140,
    }).start();
  }, [active]);

  const counts: Record<string, number> = {
    courses: courseCount,
    webinar: webinarCount,
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, wp(164)],
  });

  return (
    <View style={tabStyles.wrapper}>
      <View style={tabStyles.track}>

        {/* Sliding indicator updated with Gradient */}
        <Animated.View style={[tabStyles.indicatorContainer, { transform: [{ translateX }] }]}>
          <LinearGradient
           colors={['#86EFAC', '#4ADE80']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tabStyles.gradientIndicator}
          />
        </Animated.View>

        {TAB_OPTIONS.map(tab => {
          const isActive = active === tab.key;
          const count = counts[tab.key] || 0;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setActive(tab.key);
              }}
              style={tabStyles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <tab.Icon
                size={wp(16)}
                color={isActive ? colors.user.accentText : colors.user.subHeading}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <Text
                style={[tabStyles.label, isActive && tabStyles.labelActive]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    tabStyles.countBadge,
                    isActive && tabStyles.countBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      tabStyles.countText,
                      isActive && tabStyles.countTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    paddingBottom: hp(6),
  },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.user.cardSoft,
    borderRadius: wp(14),
    padding: wp(4),
    position: 'relative',
  },
  indicatorContainer: {
    position: 'absolute',
    top: wp(4),
    bottom: wp(4), // using bottom instead of height:'100%' prevents overflow
    left: wp(4),
    width: wp(160),
    shadowColor: colors.greenButton, // updated shadow to match gradient
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientIndicator: {
    flex: 1,
    borderRadius: wp(11),
  },
  indicator: {
    position: 'absolute',
    top: wp(4),
    left: wp(4),
    width: wp(160),
    height: '100%',
    backgroundColor: colors.user.accent,
    borderRadius: wp(11),
    shadowColor: colors.user.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    gap: wp(6),
    zIndex: 1,
  },
  label: {
    fontSize: fp(13.5),
    fontWeight: '500',
    color: colors.user.accentText,
  },
  labelActive: {
    color: colors.user.accentText,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: colors.user.accent,
    borderRadius: wp(10),
    paddingHorizontal: wp(7),
    paddingVertical: hp(1),
    minWidth: wp(22),
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.user.subHeading,
  },
  countTextActive: {
    color: colors.user.accentText,
  },
});

/* ──────────────── Empty State ──────────────── */
const EmptyState = ({ type }: { type: string }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconCircle}>
      <ShoppingBag size={wp(32)} color={colors.textPrimary} strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyText}>
      No {type === 'courses' ? 'Courses' : 'Webinars'} Yet
    </Text>
    <Text style={styles.emptySubtext}>
      {type === 'courses'
        ? 'Courses you purchase will appear here'
        : 'Webinars you enroll in will appear here'}
    </Text>
  </View>
);

/* ──────────────── Skeleton Loader ──────────────── */
const SkeletonCard = () => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulse }]}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonTextGroup}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
        </View>
      </View>
      <View style={styles.skeletonBar} />
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonBadge} />
        <View style={styles.skeletonButton} />
      </View>
    </Animated.View>
  );
};

const SkeletonList = () => (
  <View style={styles.listContent}>
    {[1, 2, 3].map(i => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

/* ──────────────── Main Screen ──────────────── */
const PurchasesScreen = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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
    funEnrolledAllWebinar(1, limit, true);
  }, []);

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

        setHasMore(newData.length >= dataLimit);
        setLoadingMore(false);
        setRefreshing(false);
      });
  };

  const loadMoreWebinars = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    funEnrolledAllWebinar(nextPage, limit);
  };

  const onRefreshWebinars = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    funEnrolledAllWebinar(1, limit, true);
  }, []);

  const onRefreshCourses = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const loadData = () => {
    dispatch(getEnrolledCourses({}));
    dispatch(getMyTransactions({ status: 'SUCCESS' }));
  };

  const courseData = enrolledCourses?.enrollments || [];
  const showCourseLoading = enrolledLoading && courseData.length === 0;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerBar,
          { paddingTop: insets.top + hp(4) },
        ]}>
        <Text style={styles.headerTitle}>My Purchases</Text>
      </View>
      <View style={styles.headerEdge} />

      {/* Segmented Tabs */}
      <SegmentedTabs
        active={active}
        setActive={setActive}
        courseCount={courseData.length}
        webinarCount={webinarData.length}
      />

      {/* Content */}
      {active === 'courses' ? (
        showCourseLoading ? (
          <SkeletonList />
        ) : (
          <FlatList
            data={courseData}
            keyExtractor={item =>
              item?.id?.toString() || Math.random().toString()
            }
            contentContainerStyle={[
              styles.listContent,
              courseData.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState type="courses" />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefreshCourses}
                colors={[colors.user.text]}
                tintColor={colors.user.accentText}
              />
            }
            renderItem={({ item }) => {
              const transaction = transactions?.find(
                (t: any) =>
                  t?.course_id === item?.id || t?.enrollment_id === item?.id,
              );

              return (
                <PurchaseCoursCard
                  item={item}
                  transaction={transaction}
                  onPress={() =>
                    navigation.navigate('UserVideoList', { item })
                  }
                />
              );
            }}
          />
        )
      ) : (
        <FlatList
          data={webinarData}
          keyExtractor={item => item?.id?.toString()}
          contentContainerStyle={[
            styles.listContent,
            webinarData.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState type="webinar" />}
          renderItem={({ item }) => <PurchaseWebinarCard item={item} />}
          onEndReached={loadMoreWebinars}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.user.accent}
                style={styles.footerLoader}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshWebinars}
              colors={[colors.user.text]}
              tintColor={colors.user.accentText}
            />
          }
        />
      )}
    </View>
  );
};

export default PurchasesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.user.bg },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    paddingBottom: hp(10),
    backgroundColor: colors.user.bg,
    zIndex: 10,
  },
  headerTitle: {
    color: colors.user.text,
    fontSize: fp(20),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerEdge: {
    backgroundColor: colors.user.bg,
    height: hp(16),
    borderBottomLeftRadius: wp(18),
    borderBottomRightRadius: wp(18),
    zIndex: 10,
  },

  listContent: {
    padding: wp(16),
    paddingBottom: hp(120),
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerLoader: {
    paddingVertical: hp(20),
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(40),
  },
  emptyIconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: colors.user.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: '#1E3A5F15',
  },
  emptyText: {
    fontSize: fp(17),
    fontWeight: '600',
    color: colors.user.accentText,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    marginTop: hp(6),
    textAlign: 'center',
    lineHeight: fp(19),
  },

  // Skeleton styles
  skeletonCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(16),
    marginBottom: hp(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#242843',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(14),
  },
  skeletonIcon: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: '#2A3057',
  },
  skeletonTextGroup: {
    flex: 1,
    marginLeft: wp(12),
    gap: hp(6),
  },
  skeletonTitle: {
    height: hp(14),
    width: '75%',
    borderRadius: wp(6),
    backgroundColor: '#2A3057',
  },
  skeletonSubtitle: {
    height: hp(10),
    width: '50%',
    borderRadius: wp(4),
    backgroundColor: '#2A3057',
  },
  skeletonBar: {
    height: hp(6),
    borderRadius: wp(3),
    backgroundColor: '#2A3057',
    marginBottom: hp(14),
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonBadge: {
    width: wp(80),
    height: hp(24),
    borderRadius: wp(6),
    backgroundColor: '#2A3057',
  },
  skeletonButton: {
    width: wp(70),
    height: hp(24),
    borderRadius: wp(6),
    backgroundColor: '#2A3057',
  },
});
