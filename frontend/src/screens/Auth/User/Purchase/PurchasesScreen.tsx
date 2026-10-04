// screens/Auth/User/Purchases/PurchasesScreen.tsx
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
  Image,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import {
  ShoppingBag,
  GraduationCap,
  Video,
  LayoutGrid,
  Users,
  Flame,
  Clock,
  BookOpen,
  CheckCircle2
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import { getMyTransactions } from '../../../../store/PaymentSlice';
import PurchaseCoursCard from './component/PurchaseCoursCard';
import PurchaseWebinarCard from './component/PurchaseWebinarCard';
import PurchaseSessionCard from './component/PurchaseSessionCard';
import { getEnrolledWebinar } from '../../../../store/WebinarSlice';
import { getMySessions, getSessionStats } from '../../../../store/SessionSlice';
import { getMyStreak } from '../../../../store/ActivitySlice';
import { wp, hp, fp } from '../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabOption = { key: string; label: string; Icon: React.ComponentType<any> };

const TAB_OPTIONS: TabOption[] = [
  { key: 'overview', label: 'Overview', Icon: LayoutGrid },
  { key: 'courses', label: 'Courses', Icon: GraduationCap },
  { key: 'webinar', label: 'Webinars', Icon: Video },
  { key: 'sessions', label: '1:1 Sessions', Icon: Users },
];

/* ──────────────── Segmented Tab Control ──────────────── */
const TRACK_PAD = wp(4);
const SegmentedTabs = ({
  active,
  setActive,
  tabs,
}: {
  active: string;
  setActive: (key: string) => void;
  tabs: TabOption[];
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === active));

  // width of the usable area, minus the track's left/right padding
  const tabWidth = (trackWidth - TRACK_PAD * 2) / tabs.length;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      friction: 10,
      tension: 140,
    }).start();
  }, [activeIndex]);

  const translateX = slideAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
  });

  return (
    <View style={tabStyles.wrapper}>
      <View
        style={tabStyles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {trackWidth > 0 && (
          <Animated.View
            style={[
              tabStyles.indicatorContainer,
              { width: tabWidth, transform: [{ translateX }] },
            ]}
          >
            <LinearGradient
              colors={[colors.greenButton, colors.creatorGreen]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tabStyles.gradientIndicator}
            />
          </Animated.View>
        )}

        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActive(tab.key)}
              style={tabStyles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <tab.Icon
                size={wp(14)}
                color={isActive ? colors.user.text : colors.user.subHeading}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <Text
                style={[tabStyles.label, isActive && tabStyles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {tab.label}
              </Text>
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
    padding: TRACK_PAD,
    borderWidth: 1,
    borderColor: colors.user.border,
  },
  indicatorContainer: {
    position: 'absolute',
    top: TRACK_PAD,
    bottom: TRACK_PAD,
    left: TRACK_PAD,            // explicit start, so translateX is exact
    shadowColor: colors.creatorGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  gradientIndicator: {
    flex: 1,
    borderRadius: wp(11),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    gap: wp(4),
    zIndex: 1,
  },
  label: {
    fontSize: fp(11.5),
    fontWeight: '500',
    color: colors.user.subHeading,
  },
  labelActive: {
    color: colors.user.text,
    fontWeight: '700',
  },
});

/* ──────────────── Empty State ──────────────── */
const EmptyState = ({ type }: { type: 'courses' | 'webinar' | 'sessions'  }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconCircle}>
      <ShoppingBag size={wp(32)} color={colors.greenButtonDark} strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyText}>
      No {type === 'courses' ? 'Courses' : type === 'webinar' ? 'Webinars' : 'Sessions'} Yet
    </Text>
    <Text style={styles.emptySubtext}>
     {type === 'courses'
        ? 'Courses you purchase will appear here'
        : type === 'webinar'
        ? 'Webinars you enroll in will appear here'
        : 'Sessions you book with experts will appear here'}
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
    {[1, 2, 3].map((i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

/* ──────────────── Course Filter Chips ──────────────── */
type CourseFilter = 'all' | 'inProgress' | 'completed';

const CourseFilterChips = ({
  active,
  setActive,
  allCount,
  inProgressCount,
  completedCount,
}: {
  active: CourseFilter;
  setActive: (f: CourseFilter) => void;
  allCount: number;
  inProgressCount: number;
  completedCount: number;
}) => {
  const chips: { key: CourseFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'inProgress', label: 'In Progress', count: inProgressCount },
    { key: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <View style={filterStyles.row}>
      {chips.map((chip) => {
        const isActive = active === chip.key;
        return (
          <Pressable
            key={chip.key}
            onPress={() => setActive(chip.key)}
            style={[filterStyles.chip, isActive && filterStyles.chipActive]}
          >
            <Text style={[filterStyles.chipText, isActive && filterStyles.chipTextActive]}>
              {chip.label} ({chip.count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const filterStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: wp(8),
    paddingHorizontal: wp(16),
    paddingBottom: hp(10),
  },
  chip: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(7),
    borderRadius: 99,
    backgroundColor: colors.user.cardSoft,
    borderWidth: 1,
    borderColor: colors.user.border,
  },
  chipActive: {
    backgroundColor: colors.greenButtonDark,
    borderColor: colors.greenButtonDark,
  },
  chipText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.user.subHeading,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

/* ──────────────── Session Filter Chips ──────────────── */
type SessionFilter = 'upcoming' | 'completed' | 'cancelled';

const SessionFilterChips = ({
  active,
  setActive,
  upcomingCount,
  completedCount,
  cancelledCount,
}: {
  active: SessionFilter;
  setActive: (f: SessionFilter) => void;
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
}) => {
  const chips: { key: SessionFilter; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
  ];

  return (
    <View style={filterStyles.row}>
      {chips.map((chip) => {
        const isActive = active === chip.key;
        return (
          <Pressable
            key={chip.key}
            onPress={() => setActive(chip.key)}
            style={[filterStyles.chip, isActive && filterStyles.chipActive]}
          >
            <Text style={[filterStyles.chipText, isActive && filterStyles.chipTextActive]}>
              {chip.label} ({chip.count})
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/* ──────────────── Circular Progress Ring ──────────────── */
const CircularProgress = ({
  percentage,
  size = wp(130),
  strokeWidth = wp(12),
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.user.cardSoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.user.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={overviewStyles.progressPercent}>{Math.round(clamped)}%</Text>
          <Text style={overviewStyles.progressCaption}>You're on track</Text>
        </View>
      </View>
    </View>
  );
};

/* ──────────────── Overview Tab ──────────────── */
const DEFAULT_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(label => ({
  date: '',
  label,
  active: false,
  isFuture: false,
}));

const OverviewTab = ({
  overallProgress,
  totalCourses,
  totalWebinars,
  totalSessions,
  hoursWatchedLabel,
  currentStreak,
  streakWeek,
  continueLearningItem,
  onPressContinue,
}: any) => {
  const week = streakWeek?.length ? streakWeek : DEFAULT_WEEK;

  return (
    <View style={overviewStyles.container}>
      {/* Overall Progress */}
      <View style={overviewStyles.progressCard}>
        <CircularProgress percentage={overallProgress} />
      </View>

      {/* Stats Grid 2x2 */}
      <View style={overviewStyles.statsGrid}>
        <View style={overviewStyles.statCard}>
          <BookOpen size={wp(20)} color={colors.user.accent} />
          <Text style={overviewStyles.statValue}>{totalCourses}</Text>
          <Text style={overviewStyles.statLabel}>Total Courses</Text>
        </View>
        <View style={overviewStyles.statCard}>
          <Video size={wp(20)} color={colors.user.accent} />
          <Text style={overviewStyles.statValue}>{totalWebinars}</Text>
          <Text style={overviewStyles.statLabel}>Total Webinars</Text>
        </View>
        <View style={overviewStyles.statCard}>
          <Users size={wp(20)} color={colors.user.accent} />
          <Text style={overviewStyles.statValue}>{totalSessions}</Text>
          <Text style={overviewStyles.statLabel}>1:1 Sessions</Text>
        </View>
        <View style={overviewStyles.statCard}>
          <Clock size={wp(20)} color={colors.user.accent} />
          <Text style={overviewStyles.statValue}>{hoursWatchedLabel}</Text>
          <Text style={overviewStyles.statLabel}>Hours Watched</Text>
        </View>
      </View>

      {/* Learning Streak */}
      <View style={overviewStyles.streakCard}>
        <View style={overviewStyles.streakHeader}>
          <Flame size={wp(18)} color={colors.user.highlight} fill={colors.user.highlight} />
          <Text style={overviewStyles.streakTitle}>Learning Streak</Text>
          <Text style={overviewStyles.streakDays}>{currentStreak} Days</Text>
        </View>
        <View style={overviewStyles.streakRow}>
          {week.map((d: any, i: number) => (
            <View key={i} style={overviewStyles.streakDayWrap}>
              <View
                style={[
                  overviewStyles.streakDayCircle,
                  d.active && overviewStyles.streakDayCircleActive,
                ]}
              >
                {d.active && <CheckCircle2 size={wp(14)} color={colors.white} />}
              </View>
              <Text style={overviewStyles.streakDayLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Continue Learning */}
      <View style={overviewStyles.sectionHeaderRow}>
        <Text style={overviewStyles.sectionHeader}>Continue Learning</Text>
        <TouchableOpacity>
          <Text style={overviewStyles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {continueLearningItem ? (
        <Pressable
          style={overviewStyles.continueCard}
          onPress={() => onPressContinue?.(continueLearningItem)}
        >
          {continueLearningItem?.course?.thumbnail_url ? (
            <Image
              source={{ uri: continueLearningItem.course.thumbnail_url }}
              style={overviewStyles.continueImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[overviewStyles.continueImage, overviewStyles.continueImageFallback]} />
          )}
          <View style={overviewStyles.continueContent}>
            {continueLearningItem?.course?.category && (
              <Text style={overviewStyles.continueCategory} numberOfLines={1}>
                {continueLearningItem.course.category}
              </Text>
            )}
            <Text style={overviewStyles.continueTitle} numberOfLines={2}>
              {continueLearningItem?.course?.title || 'Untitled Course'}
            </Text>
            <View style={{ marginTop: hp(8) }}>
              <View style={overviewStyles.continueProgressTrack}>
                <View
                  style={[
                    overviewStyles.continueProgressFill,
                    { width: `${continueLearningItem?.progress || 0}%` },
                  ]}
                />
              </View>
              <Text style={overviewStyles.continueProgressLabel}>
                {continueLearningItem?.progress || 0}% complete
              </Text>
            </View>
            <TouchableOpacity
              style={overviewStyles.continueBtnWrapper}
              onPress={() => onPressContinue?.(continueLearningItem)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.greenButton, colors.creatorGreen]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={overviewStyles.continueBtnGradient}
              >
                <Text style={overviewStyles.continueBtnText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      ) : (
        <Text style={overviewStyles.emptyContinueText}>
          No courses in progress right now.
        </Text>
      )}
    </View>
  );
};

/* ──────────────── Main Screen ──────────────── */
const PurchasesScreen = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { list: enrolledCourses, loading: enrolledLoading, total:enrolledCoursesTotal} = useSelector(
    (state: any) => state.enrollmentsReducer,
  );
  const { transactions } = useSelector((state: any) => state.paymentReducer);
  const {stats: sessionStats} = useSelector((state: any) => state.sessionReducer);
  const { sessions: sessionsData, loading: sessionsLoading } = useSelector(
  (state: any) => state.sessionReducer,
  );
  const {current_streak, week: streakWeek} = useSelector(
    (state: any) => state.activityReducer,
  )
  const [active, setActive] = useState('overview');

  // Pagination states
  const [webinarData, setWebinarData] = useState<any[]>([]);
  const [webinarTotal, setWebinarTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadData()
     dispatch(getSessionStats());
   dispatch(getMyStreak());
   dispatch(getMySessions({role: 'caller', limit: 100}))
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
      .then((response: any) => {
        const newData = response?.data?.data?.enrollments || [];
        const totalCount = response?.data?.data?.pagination?.total;

        if (isRefresh) {
          setWebinarData(newData);
        } else {
          setWebinarData((prev) => [...prev, ...newData]);
        }
 if (typeof totalCount === 'number') setWebinarTotal(totalCount);
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
     dispatch(getEnrolledCourses({ limit: 100 }));
    dispatch(getMyTransactions({ status: 'SUCCESS' }));
  };

  const courseData = Array.isArray(enrolledCourses)
  ? enrolledCourses
  :(enrolledCourses?.enrollments || []);
  const showCourseLoading = enrolledLoading && courseData.length === 0;

  const overallProgress = courseData.length 
  ? Math.round(
    courseData.reduce((sum: number, e: any) => sum + (e?.progress || 0), 0)/
    courseData.length,
  )
  : 0;

  const  hoursWatchedSeconds = courseData.reduce((sum: number, e: any) => {
    const courseDurationSecs = (e?.course?.videos || []).reduce(
      (s: number,  v: any) => s + (v?.duration || 0),
      0,
    );
    return sum + courseDurationSecs * ((e?.progress || 0)/100);
  }, 0)

  const hoursWatchedLabel = (() => {
    const totalMinutes = Math.round(hoursWatchedSeconds / 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  })();

  const continueLearningItem = [...courseData]
    .filter((e: any) => (e?.progress || 0) > 0 && (e?.progress || 0) < 100)
    .sort(
      (a: any, b: any) =>
        new Date(b?.last_watched_at || b?.enrolled_at || 0).getTime() -
        new Date(a?.last_watched_at || a?.enrolled_at || 0).getTime(),
    )[0];

   const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const inProgressCount = courseData.filter(
    (e: any) => (e?.progress || 0) > 0 && (e?.progress || 0) < 100,
  ).length;
  const completedCount = courseData.filter((e: any) => (e?.progress || 0) >= 100).length;
  const allCount = enrolledCoursesTotal || courseData.length;

  const filteredCourseData =
    courseFilter === 'all'
      ? courseData
      : courseFilter === 'inProgress'
      ? courseData.filter((e: any) => (e?.progress || 0) > 0 && (e?.progress || 0) < 100)
      : courseData.filter((e: any) => (e?.progress || 0) >= 100);
      
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('upcoming');

  const upcomingSessionsCount = sessionsData.filter(
    (s: any) => s?.status === 'PENDING' || s?.status === 'ACTIVE',
  ).length;
  const completedSessionsCount = sessionsData.filter((s: any) => s?.status === 'COMPLETED').length;
  const cancelledSessionsCount = sessionsData.filter((s: any) => s?.status === 'CANCELLED').length;

  const filteredSessionsData =
    sessionFilter === 'upcoming'
      ? sessionsData.filter((s: any) => s?.status === 'PENDING' || s?.status === 'ACTIVE')
      : sessionFilter === 'completed'
      ? sessionsData.filter((s: any) => s?.status === 'COMPLETED')
      : sessionsData.filter((s: any) => s?.status === 'CANCELLED');

  const showSessionsLoading = sessionsLoading && sessionsData.length === 0;

  const handleJoinSessionPlaceholder = () => {
    Toast.show({
      type: 'info',
      text1: 'Coming soon',
      text2: 'Live session joining isn\'t wired up yet.',
      position: 'top',
    });
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerBar,
          { paddingTop: insets.top + hp(4) },
        ]}
      >
        <Text style={styles.headerTitle}>My Purchases</Text>
      </View>
      <View style={styles.headerEdge} />

      {/* Segmented Tabs */}
      <SegmentedTabs
        active={active}
        setActive={setActive}
        tabs={TAB_OPTIONS}
      />

      {/* Content */}
      {active === 'overview' ? (
         <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                onRefreshCourses();
                dispatch(getSessionStats());
                dispatch(getMyStreak());
              }}
              colors={[colors.user.text]}
              tintColor={colors.user.accentText}
            />
          }
       >
         <OverviewTab
            overallProgress={overallProgress}
            totalCourses={enrolledCoursesTotal || courseData.length}
            totalWebinars={webinarTotal || webinarData.length}
            totalSessions={sessionStats?.total_sessions || 0}
            hoursWatchedLabel={hoursWatchedLabel}
            currentStreak={current_streak || 0}
            streakWeek={streakWeek}
            continueLearningItem={continueLearningItem}
            onPressContinue={(item: any) =>
              navigation.navigate('UserVideoList', { item })
            }
          />
        </ScrollView>
      ) : active === 'sessions' ? (
         showSessionsLoading ? (
          <SkeletonList />
        ) : (
          <FlatList
            data={filteredSessionsData}
            keyExtractor={(item: any) => item?.id?.toString() || Math.random().toString()}
            contentContainerStyle={[
              styles.listContent,
              filteredSessionsData.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <SessionFilterChips
                active={sessionFilter}
                setActive={setSessionFilter}
                upcomingCount={upcomingSessionsCount}
                completedCount={completedSessionsCount}
                cancelledCount={cancelledSessionsCount}
              />
          }
          stickyHeaderIndices={[0]}
            ListEmptyComponent={<EmptyState type="sessions" />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  dispatch(getMySessions({ role: 'caller', limit: 100 }));
                  setTimeout(() => setRefreshing(false), 800);
                }}
                colors={[colors.user.text]}
                tintColor={colors.user.accentText}
              />
            }
          renderItem={({ item }) => (
              <PurchaseSessionCard item={item} onJoinPress={handleJoinSessionPlaceholder} />
            )}
          />
        )      
      ) : active === 'courses' ? (
        showCourseLoading ? (
          <SkeletonList />
        ) : (
          <FlatList
           data={filteredCourseData}
            keyExtractor={(item) =>
              item?.id?.toString() || Math.random().toString()
            }
            contentContainerStyle={[
              styles.listContent,
              filteredCourseData.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
             ListHeaderComponent={
              <CourseFilterChips
                active={courseFilter}
                setActive={setCourseFilter}
                allCount={allCount}
                inProgressCount={inProgressCount}
                completedCount={completedCount}
              />
            }
            stickyHeaderIndices={[0]}
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
            
              return (
                <PurchaseCoursCard
                  item={item}
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
          keyExtractor={(item) => item?.id?.toString()}
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
    backgroundColor: colors.user.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: colors.user.border,
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
    borderColor: colors.user.border,
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
    backgroundColor: colors.user.cardSoft,
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
    backgroundColor: colors.user.cardSoft,
  },
  skeletonSubtitle: {
    height: hp(10),
    width: '50%',
    borderRadius: wp(4),
    backgroundColor: colors.user.cardSoft,
  },
  skeletonBar: {
    height: hp(6),
    borderRadius: wp(3),
    backgroundColor: colors.user.cardSoft,
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
    backgroundColor: colors.user.cardSoft,
  },
  skeletonButton: {
    width: wp(70),
    height: hp(24),
    borderRadius: wp(6),
    backgroundColor: colors.user.cardSoft,
  },
});
const overviewStyles = StyleSheet.create({
  container: { gap: hp(16) },
  progressCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(16),
    paddingVertical: hp(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.user.border,
  },
  progressPercent: {
    fontSize: fp(26),
    fontWeight: '700',
    color: colors.user.text,
  },
  progressCaption: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    marginTop: hp(2),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(12),
  },
  statCard: {
    flexBasis: '47%',
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.user.border,
    gap: hp(4),
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
  },
  statLabel: {
    fontSize: fp(11),
    color: colors.user.subHeading,
  },
  streakCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.user.border,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(12),
  },
  streakTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.user.text,
    flex: 1,
  },
  streakDays: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.user.highlight,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDayWrap: { alignItems: 'center', gap: hp(4) },
  streakDayCircle: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.user.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDayCircleActive: {
    backgroundColor: colors.user.accent,
  },
  streakDayLabel: {
    fontSize: fp(10),
    color: colors.user.subHeading,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.user.text,
  },
  seeAll: {
    fontSize: fp(12),
    color: colors.greenButtonDark,
    fontWeight: '600',
  },
  continueCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.user.border,
  },
  continueImage: { width: '100%', height: hp(140) },
  continueImageFallback: { backgroundColor: colors.user.accentSoft},
  continueContent: { padding: wp(14) },
  continueCategory: {
    fontSize: fp(11),
    color: colors.greenButtonDark,
    fontWeight: '600',
    marginBottom: hp(4),
  },
  continueTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.user.text,
  },
  continueProgressTrack: {
    height: hp(5),
    backgroundColor: colors.user.cardSoft,
    borderRadius: 99,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: colors.user.accent,
    borderRadius: 99,
  },
  continueProgressLabel: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    marginTop: hp(4),
  },
  continueBtnWrapper: {
    marginTop: hp(12),
    borderRadius: 8,
    overflow: 'hidden',
  },
  continueBtnGradient: {
    paddingVertical: hp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: colors.user.accentText,
    fontWeight: '700',
    fontSize: fp(13),
  },
  emptyContinueText: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    textAlign: 'center',
    paddingVertical: hp(20),
  },
});