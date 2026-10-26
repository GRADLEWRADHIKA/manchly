import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  BookOpen,
  Users,
  Video,
  Search,
  MoreVertical,
  Calendar,
  ExternalLink,
  BarChart3,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import {
  getDashboardStats,
  getMySessionProducts,
  getSessionStats,
} from '../../../store/SessionSlice';
import {
  fetchCourses,
  getCreatorCourseStats,
} from '../../../store/CourseSlice';
import {
  getCreatorWebinarStats,
  getAllWebinar,
} from '../../../store/WebinarSlice';
import { useRoute } from '@react-navigation/native';


const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const GOLD_GLOW = '#FFDCA1';
const CARD_BG = '#1A1A1A';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

const TABS = ['Course', 'Webinar','1:1 Session'] as const;
type Tab = (typeof TABS)[number];

const STEP_META: Record<Tab, { label: string; Icon: any }> = {
  Course: { label: 'COURSE', Icon: BookOpen },
  Webinar: { label: 'WEBINAR', Icon: Video },
  '1:1 Session': { label: '1:1 SESSION', Icon: Users },
};

const fmt = (n: number) => {
  const val = Math.round(n * 100) / 100;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val}`;
};

const getWebinarStatusLabel = (webinar: any) => {
  if (webinar?.status === 'DRAFT') return 'Draft';
  if (webinar?.status === 'CANCELLED') return 'Cancelled';
  return new Date(webinar?.scheduled_at).getTime() > Date.now()
    ? 'Upcoming'
    : 'Completed';
};

const Dashboard = () => {
  const route = useRoute<any>();
  console.log('Dashboard rendered. route.params:', route.params);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();

  const {
    dashboard,
    products: sessionProducts,
    stats: sessionStats,
  } = useSelector((state: any) => state.sessionReducer);
  const {
    list: courses,
    loading: coursesLoading,
    creatorStats,
  } = useSelector((state: any) => state.coursesReducer);
  const {
    creatorWebinarStats,
    list: webinars,
    listLoading: webinarsLoading,
    listTotal: webinarTotal,
  } = useSelector((state: any) => state.webinarReducer);

  const [activeTab, setActiveTab] = useState<Tab>(
    route.params?.initialTab || '1:1 Session',
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGoToDashboard = () => {
    Linking.openURL('https://dashboard.manchly.com').catch(() => {});
  };

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      dispatch(getDashboardStats()).finally(() => setLoading(false));
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused || activeTab !== 'Course') return;
    dispatch(getCreatorCourseStats());
  }, [isFocused, activeTab]);

  useEffect(() => {
    if (!isFocused || activeTab !== 'Course') return;
    const timer = setTimeout(
      () => {
        dispatch(
          fetchCourses({
            page: 1,
            limit: 50,
            my_courses: true,
            status: 'ALL',
            ...(searchQuery ? { search: searchQuery } : {}),
          }),
        );
      },
      searchQuery ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [isFocused, activeTab, searchQuery]);

  useEffect(() => {
    if (!isFocused || activeTab !== 'Webinar') return;
    dispatch(getCreatorWebinarStats());
  }, [isFocused, activeTab]);

  useEffect(() => {
    if (!isFocused || activeTab !== 'Webinar') return;
    const timer = setTimeout(
      () => {
        dispatch(
          getAllWebinar({
            page: 1,
            limit: 50,
            my_webinars: true,
            upcoming: false,
            ...(searchQuery ? { search: searchQuery } : {}),
          }),
        );
      },
      searchQuery ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [isFocused, activeTab, searchQuery]);

  useEffect(() => {
    if (!isFocused || activeTab !== '1:1 Session') return;
    dispatch(getMySessionProducts());
    dispatch(getSessionStats());
  }, [isFocused, activeTab]);

  useEffect(() => {
    console.log(
      'initialTab effect fired. params:',
      route.params?.initialTab,
      'current activeTab:',
      activeTab,
    );
    if (route.params?.initialTab && route.params.initialTab !== activeTab) {
      console.log('Switching tab to:', route.params.initialTab);
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  const totalCoursesCount =
    creatorStats?.statistics?.total_courses ?? courses?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Centered Header */}
      <View style={[styles.headerArea, { paddingTop: insets.top + hp(14) }]}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Stepper Selector */}
      <View style={styles.stepperRow}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab;
          const { label, Icon } = STEP_META[tab];
          return (
            <React.Fragment key={tab}>
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[GOLD_CREAM, GOLD_DEEP]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepRingActive}
                  >
                    <View style={styles.stepCircleActive}>
                      <Icon size={wp(16)} color={'#F0C040'} strokeWidth={2} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.stepCircle}>
                    <Icon
                      size={wp(16)}
                      color={'rgba(240,192,64,0.5)'}
                      strokeWidth={2}
                    />
                  </View>
                )}
                <Text
                  style={[styles.stepLabel, isActive && styles.stepLabelActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
              {i < TABS.length - 1 && <View style={styles.stepLine} />}
            </React.Fragment>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={GOLD_DEEP} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + hp(30) },
          ]}
        >
          {activeTab === '1:1 Session' ? (
            <>
              {/* Top Session Count Header */}
              <Text style={styles.coursesCountHeader}>
                {sessionProducts?.length ?? 0} Sessions
              </Text>

              {/* Session Stat Cards */}
              <View style={styles.courseStatsRow}>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Users size={wp(18)} color={GOLD_DEEP} strokeWidth={2} />
                  </View>
                  <Text style={styles.courseStatValue}>
                    {sessionProducts?.length ?? 0}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Sessions</Text>
                </View>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Text style={styles.rupeeIcon}>₹</Text>
                  </View>
                  <Text
                    style={styles.courseStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {fmt(sessionStats?.total_earnings || 0)}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Revenue</Text>
                </View>
              </View>

              {/* Session Product List */}
              {sessionProducts && sessionProducts.length > 0 ? (
                sessionProducts.slice(0, 5).map((product: any) => (
                  <View key={product.id} style={styles.courseCard}>
                    <View
                      style={[styles.courseThumb, styles.sessionThumbFallback]}
                    >
                      {product.mode === 'VIDEO' ? (
                        <Video
                          size={wp(28)}
                          color={GOLD_DEEP}
                          strokeWidth={1.5}
                        />
                      ) : (
                        <Users
                          size={wp(28)}
                          color={GOLD_DEEP}
                          strokeWidth={1.5}
                        />
                      )}
                    </View>
                    <View style={styles.courseCardBody}>
                      <View style={styles.courseCardTopRow}>
                        <Text style={styles.courseCardTitle} numberOfLines={2}>
                          {product.title}
                        </Text>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={{ paddingLeft: wp(4) }}
                        >
                          <MoreVertical
                            size={wp(18)}
                            color="rgba(255,255,255,0.6)"
                          />
                        </TouchableOpacity>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          product.is_active
                            ? styles.statusPillPublished
                            : styles.statusPillDraft,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            product.is_active
                              ? styles.statusPillTextPublished
                              : styles.statusPillTextDraft,
                          ]}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                      <View style={styles.courseCardMetaRow}>
                        <Calendar
                          size={wp(13)}
                          color="rgba(255,255,255,0.55)"
                          strokeWidth={2}
                        />
                        <Text style={styles.courseCardMetaText}>
                          {product.duration} min
                        </Text>
                        <Text style={styles.courseCardMetaDot}>•</Text>
                        <Text style={styles.courseCardMetaText}>
                          {product.mode === 'VIDEO' ? 'Video' : 'Call'}
                        </Text>
                        <Text style={styles.courseCardMetaDot}>•</Text>
                        <Text style={styles.courseCardMetaText}>
                          {fmt(product.price)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyCoursesText}>No sessions yet.</Text>
              )}
            </>
          ) : activeTab === 'Webinar' ? (
            <>
              {/* Top Webinar Count Header */}
              <Text style={styles.coursesCountHeader}>
                {webinarsLoading ? '—' : `${webinarTotal ?? 0} Webinars`}
              </Text>

              {/* Webinar Stat Cards */}
              <View style={styles.courseStatsRow}>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Video size={wp(18)} color={GOLD_DEEP} strokeWidth={2} />
                  </View>
                  <Text style={styles.courseStatValue}>
                    {creatorWebinarStats?.statistics?.total_webinars ?? 0}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Webinars</Text>
                </View>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Users size={wp(18)} color={GOLD_DEEP} strokeWidth={2} />
                  </View>
                  <Text style={styles.courseStatValue}>
                    {creatorWebinarStats?.statistics?.total_enrollments ?? 0}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Users</Text>
                </View>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Text style={styles.rupeeIcon}>₹</Text>
                  </View>
                  <Text
                    style={styles.courseStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {fmt(creatorWebinarStats?.statistics?.revenue || 0)}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Revenue</Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={wp(18)} color="#F0C040" strokeWidth={2.5} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search webinars..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Webinar List */}
              {webinarsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={GOLD_DEEP}
                  style={{ marginTop: hp(24) }}
                />
              ) : webinars && webinars.length > 0 ? (
                webinars.slice(0, 5).map((webinar: any) => {
                  const statusLabel = getWebinarStatusLabel(webinar);
                  const isUpcoming = statusLabel === 'Upcoming';

                  return (
                    <View key={webinar.id} style={styles.courseCard}>
                      <Image
                        source={{
                          uri: webinar.thumbnail_url || webinar.thumbnail,
                        }}
                        style={styles.courseThumb}
                      />
                      <View style={styles.courseCardBody}>
                        <View style={styles.courseCardTopRow}>
                          <Text
                            style={styles.courseCardTitle}
                            numberOfLines={2}
                          >
                            {webinar.title}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={{ paddingLeft: wp(4) }}
                          >
                            <MoreVertical
                              size={wp(18)}
                              color="rgba(255,255,255,0.6)"
                            />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            isUpcoming
                              ? styles.statusPillPublished
                              : styles.statusPillDraft,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              isUpcoming
                                ? styles.statusPillTextPublished
                                : styles.statusPillTextDraft,
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                        <View style={styles.courseCardMetaRow}>
                          <Calendar
                            size={wp(13)}
                            color="rgba(255,255,255,0.55)"
                            strokeWidth={2}
                          />
                          <Text style={styles.courseCardMetaText}>
                            {new Date(webinar.scheduled_at).toLocaleDateString(
                              'en-IN',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </Text>
                          <Text style={styles.courseCardMetaDot}>•</Text>
                          <Users
                            size={wp(13)}
                            color="rgba(255,255,255,0.55)"
                            strokeWidth={2}
                          />
                          <Text style={styles.courseCardMetaText}>
                            {webinar.enrollment_count ?? 0} Registered
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyCoursesText}>
                  {searchQuery
                    ? 'No webinars match your search.'
                    : 'No webinars yet.'}
                </Text>
              )}
            </>
          ) : (
            <>
              {/* Top Course Count Header */}
              <Text style={styles.coursesCountHeader}>
                {totalCoursesCount} Courses
              </Text>

              {/* Course Stat Cards */}
              <View style={styles.courseStatsRow}>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <BookOpen size={wp(18)} color={GOLD_DEEP} strokeWidth={2} />
                  </View>
                  <Text style={styles.courseStatValue}>
                    {creatorStats?.statistics?.total_courses ?? 0}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Courses</Text>
                </View>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Users size={wp(18)} color={GOLD_DEEP} strokeWidth={2} />
                  </View>
                  <Text style={styles.courseStatValue}>
                    {creatorStats?.statistics?.total_enrollments ?? 0}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Enrolled</Text>
                </View>
                <View style={styles.courseStatCard}>
                  <View style={styles.courseStatIconWrap}>
                    <Text style={styles.rupeeIcon}>₹</Text>
                  </View>
                  <Text
                    style={styles.courseStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {fmt(creatorStats?.statistics?.revenue || 0)}
                  </Text>
                  <Text style={styles.courseStatLabel}>Total Revenue</Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Search size={wp(18)} color="#F0C040" strokeWidth={2.5} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search courses..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Course List */}
              {coursesLoading ? (
                <ActivityIndicator
                  size="small"
                  color={GOLD_DEEP}
                  style={{ marginTop: hp(24) }}
                />
              ) : courses && courses.length > 0 ? (
                courses.slice(0, 5).map((course: any) => {
                  const statusNormalized = (course.status || '').toUpperCase();
                  const isPublished = statusNormalized === 'PUBLISHED';
                  const isDraft = statusNormalized === 'DRAFT';

                  return (
                    <View key={course.id} style={styles.courseCard}>
                      <Image
                        source={{
                          uri: course.thumbnail_url || course.thumbnail,
                        }}
                        style={styles.courseThumb}
                      />
                      <View style={styles.courseCardBody}>
                        <View style={styles.courseCardTopRow}>
                          <Text
                            style={styles.courseCardTitle}
                            numberOfLines={2}
                          >
                            {course.title}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={{ paddingLeft: wp(4) }}
                          >
                            <MoreVertical
                              size={wp(18)}
                              color="rgba(255,255,255,0.6)"
                            />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            isPublished
                              ? styles.statusPillPublished
                              : styles.statusPillDraft,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              isPublished
                                ? styles.statusPillTextPublished
                                : styles.statusPillTextDraft,
                            ]}
                          >
                            {isPublished
                              ? 'Published'
                              : isDraft
                              ? 'Draft'
                              : course.status || 'Draft'}
                          </Text>
                        </View>
                        <View style={styles.courseCardMetaRow}>
                          <Calendar
                            size={wp(13)}
                            color="rgba(255,255,255,0.55)"
                            strokeWidth={2}
                          />
                          <Text style={styles.courseCardMetaText}>
                            {course.videos?.length || course.total_lessons || 0}{' '}
                            Lessons
                          </Text>
                          <Text style={styles.courseCardMetaDot}>•</Text>
                          <Users
                            size={wp(13)}
                            color="rgba(255,255,255,0.55)"
                            strokeWidth={2}
                          />
                          <Text style={styles.courseCardMetaText}>
                            {course.total_enrollments ?? 0} Enrolled
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyCoursesText}>
                  {searchQuery
                    ? 'No courses match your search.'
                    : 'No courses yet.'}
                </Text>
              )}
            </>
          )}
          {/* Insights CTA Card — visible on all tabs */}
          <View style={styles.insightsCard}>
            <View style={styles.insightsIconWrap}>
              <BarChart3 size={wp(20)} color={GOLD_DEEP} strokeWidth={2} />
            </View>
            <View style={styles.insightsTextWrap}>
              <Text style={styles.insightsTitle}>
                Need more detailed insights?
              </Text>
              <Text style={styles.insightsSubtitle}>
                Check your full dashboard for advanced data, analytics and
                reports.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.insightsBtn}
              onPress={handleGoToDashboard}
              activeOpacity={0.85}
            >
              <ExternalLink size={wp(14)} color="#3A2C12" strokeWidth={2.2} />
              <Text style={styles.insightsBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default memo(Dashboard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerArea: {
    alignItems: 'center',
    paddingHorizontal: wp(18),
    paddingBottom: hp(18),
  },
  title: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: wp(18),
    paddingTop: hp(10),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: wp(30),
    paddingBottom: hp(10),
  },
  stepItem: {
    alignItems: 'center',
    width: wp(64),
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: wp(19),
  },
  stepCircle: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
  },
  stepRingActive: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
    shadowColor: GOLD_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: wp(10),
    elevation: 10,
  },
  stepCircleActive: {
    width: wp(35),
    height: wp(35),
    borderRadius: wp(17.5),
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: fp(9),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: '#F0C040',
    fontWeight: '700',
  },

  // Breakdown Card / Leader Row
  listCard: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: wp(14),
    marginTop: hp(16),
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
  },
  leaderRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  rankBadge: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
    backgroundColor: 'rgba(214,156,63,0.12)',
  },
  leaderName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  leaderRevenue: {
    fontSize: fp(14),
    fontWeight: '700',
    color: GOLD_CREAM,
  },

  // Headers
  coursesCountHeader: {
    fontSize: fp(15),
    fontWeight: '600',
    color: '#A1A1A1',
    marginBottom: hp(12),
    paddingLeft: wp(2),
  },

  // Stats Row
  courseStatsRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(16),
  },
  courseStatCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: wp(12),
  },
  courseStatIconWrap: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(8),
    backgroundColor: 'rgba(214,156,63,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  rupeeIcon: {
    fontSize: fp(16),
    fontWeight: '800',
    color: GOLD_DEEP,
  },
  courseStatValue: {
    fontSize: fp(20),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: hp(2),
  },
  courseStatLabel: {
    fontSize: fp(10.5),
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    backgroundColor: '#1E1E1E',
    borderRadius: wp(24),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: wp(16),
    height: hp(46),
    marginBottom: hp(16),
  },
  searchInput: {
    flex: 1,
    fontSize: fp(13.5),
    color: '#FFFFFF',
    padding: 0,
  },

  // Item Card
  courseCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: wp(12),
    marginBottom: hp(12),
    alignItems: 'center',
  },
  courseThumb: {
    width: wp(78),
    height: wp(78),
    borderRadius: wp(12),
    backgroundColor: '#0E0E0E',
    marginRight: wp(12),
  },
  courseCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  courseCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(6),
  },
  courseCardTitle: {
    flex: 1,
    fontSize: fp(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: wp(6),
    lineHeight: fp(18),
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: wp(14),
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    marginBottom: hp(8),
  },
  statusPillPublished: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  statusPillDraft: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusPillText: {
    fontSize: fp(10.5),
    fontWeight: '700',
  },
  statusPillTextPublished: {
    color: '#10B981',
  },
  statusPillTextDraft: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  courseCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  courseCardMetaText: {
    fontSize: fp(11),
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
  },
  courseCardMetaDot: {
    fontSize: fp(11),
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: wp(2),
  },
  emptyCoursesText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: fp(13),
    marginTop: hp(24),
  },
  sessionThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,156,63,0.10)',
  },
  insightsCard: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(214,156,63,0.35)',
    padding: wp(16),
    marginTop: hp(8),
  },
  insightsIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(10),
    backgroundColor: 'rgba(214,156,63,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  insightsTextWrap: {
    marginBottom: hp(14),
  },
  insightsTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: hp(4),
  },
  insightsSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
    lineHeight: fp(17),
  },
  insightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: GOLD_DEEP,
    borderRadius: wp(12),
    height: hp(46),
  },
  insightsBtnText: {
    color: '#3A2C12',
    fontWeight: '700',
    fontSize: fp(14),
  },
});
