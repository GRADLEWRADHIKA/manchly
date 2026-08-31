import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import {
  Search,
  BookOpen,
  Play,
  PlayCircle,
  Star,
  Clock,
  Calendar,
  User as UserIcon,
  Users,
  ArrowRight,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import ShimmerBox from '../../../../components/ShimmerBox';

const PAGE_SIZE = 8;


/* First-load shimmer skeleton (search + toggle + hero card + list cards) */
const ExploreSkeleton = () => (
  <View style={styles.scrollContent}>
    <ShimmerBox
      height={hp(50)}
      radius={wp(14)}
      style={{ marginTop: hp(8), marginBottom: hp(16) }}
    />
    <View style={styles.toggleRow}>
      <ShimmerBox height={hp(46)} radius={wp(14)} style={{ flex: 1 }} />
      <ShimmerBox height={hp(46)} radius={wp(14)} style={{ flex: 1 }} />
    </View>
    <ShimmerBox height={hp(250)} radius={wp(18)} style={{ marginBottom: hp(24) }} />
    <ShimmerBox
      width={wp(180)}
      height={hp(24)}
      radius={wp(6)}
      style={{ marginBottom: hp(14) }}
    />
    {[0, 1].map(i => (
      <ShimmerBox
        key={i}
        height={hp(214)}
        radius={wp(18)}
        style={{ marginBottom: hp(16) }}
      />
    ))}
  </View>
);

const fmtPrice = (p: any) => (Number(p) > 0 ? `₹${Number(p).toLocaleString('en-IN')}` : 'Free');

const fmtDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const fmtCount = (n: any) => {
  const num = Number(n) || 0;
  if (num >= 1000) {
    const k = num / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K+`;
  }
  return `${num}`;
};

const courseDuration = (course: any) => {
  const totalSeconds =
    course?.videos?.reduce((sum: number, v: any) => sum + (v.duration || 0), 0) || 0;
  if (totalSeconds > 0) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  if (course?.duration) return `${course.duration}h`;
  return '';
};

type Tab = 'Courses' | 'Webinars';

const ExploreDetail = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const insets = useSafeAreaInsets();
  const focus = useIsFocused();

  const [activeTab, setActiveTab] = useState<Tab>(
    route.params?.initialTab === 'Webinars' ? 'Webinars' : 'Courses',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [firstLoadDone, setFirstLoadDone] = useState(false);

  // Courses paging
  const [courses, setCourses] = useState<any[]>([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseTotalPages, setCourseTotalPages] = useState(1);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesLoadingMore, setCoursesLoadingMore] = useState(false);

  // Webinars paging
  const [webinars, setWebinars] = useState<any[]>([]);
  const [webinarPage, setWebinarPage] = useState(1);
  const [webinarTotalPages, setWebinarTotalPages] = useState(1);
  const [webinarsLoading, setWebinarsLoading] = useState(false);
  const [webinarsLoadingMore, setWebinarsLoadingMore] = useState(false);

  /* ─────────── Fetchers ─────────── */
  const fetchCoursePage = useCallback(
    async (page: number, search: string, append: boolean) => {
      append ? setCoursesLoadingMore(true) : setCoursesLoading(true);
      try {
        const res: any = await dispatch(
          fetchCourses({ page, limit: PAGE_SIZE, ...(search ? { search } : {}) }),
        ).unwrap();
        const payload = res?.data?.data;
        const list = payload?.courses || [];
        setCourses(prev => (append ? [...prev, ...list] : list));
        setCoursePage(page);
        setCourseTotalPages(payload?.pagination?.total_pages ?? 1);
      } catch {
        if (!append) setCourses([]);
      } finally {
        append ? setCoursesLoadingMore(false) : setCoursesLoading(false);
      }
    },
    [dispatch],
  );

  const fetchWebinarPage = useCallback(
    async (page: number, search: string, append: boolean) => {
      append ? setWebinarsLoadingMore(true) : setWebinarsLoading(true);
      try {
        const res: any = await dispatch(
          getAllWebinar({ page, limit: PAGE_SIZE, upcoming: true, search }),
        ).unwrap();
        const payload = res?.data?.data;
        const list = (payload?.webinars || []).filter((w: any) => !w.is_enrolled);
        setWebinars(prev => (append ? [...prev, ...list] : list));
        setWebinarPage(page);
        setWebinarTotalPages(payload?.pagination?.total_pages ?? 1);
      } catch {
        if (!append) setWebinars([]);
      } finally {
        append ? setWebinarsLoadingMore(false) : setWebinarsLoading(false);
      }
    },
    [dispatch],
  );

  /* ─────────── Debounce search ─────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ─────────── Load page 1 on focus / query change ─────────── */
  useEffect(() => {
    if (!focus) return;
    Promise.all([
      fetchCoursePage(1, debouncedQuery, false),
      fetchWebinarPage(1, debouncedQuery, false),
    ]).finally(() => setFirstLoadDone(true));
  }, [focus, debouncedQuery, fetchCoursePage, fetchWebinarPage]);

  const onEndReached = () => {
    if (activeTab === 'Courses') {
      if (!coursesLoading && !coursesLoadingMore && coursePage < courseTotalPages) {
        fetchCoursePage(coursePage + 1, debouncedQuery, true);
      }
    } else if (!webinarsLoading && !webinarsLoadingMore && webinarPage < webinarTotalPages) {
      fetchWebinarPage(webinarPage + 1, debouncedQuery, true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCoursePage(1, debouncedQuery, false),
      fetchWebinarPage(1, debouncedQuery, false),
    ]);
    setRefreshing(false);
  };

  const openCourse = (course: any) =>
    navigation.navigate('CourseDetailsScreen', {
      courseId: course?.id,
      videoList: course?.videos,
    });
  const openWebinar = (webinar: any) =>
    navigation.navigate('WebinarDetails', { data: webinar });

  const featured = courses[0];
  const popular = courses.slice(1);
  const listData = activeTab === 'Courses' ? popular : webinars;
  const isCourses = activeTab === 'Courses';
  const tabLoading = isCourses ? coursesLoading : webinarsLoading;
  const tabLoadingMore = isCourses ? coursesLoadingMore : webinarsLoadingMore;
  const tabCount = isCourses ? courses.length : webinars.length;

  /* ─────────── Row renderers ─────────── */
 const renderCourse = ({ item: course }: any) => {
  const dur = courseDuration(course);
  const rating = course.average_rating || course.rating;
  return (
    <TouchableOpacity
      style={styles.popularCard}
      activeOpacity={0.9}
      onPress={() => openCourse(course)}
    >
      <View style={styles.popularImageWrap}>
        {course.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.popularImage} resizeMode='contain'/>
        ) : (
          <View style={[styles.popularImage, styles.imgPlaceholder]}>
            <BookOpen size={wp(28)} color={colors.btnGradientStart} strokeWidth={1.4} />
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{course.level || 'Beginner'}</Text>
        </View>
      </View>

      <View style={styles.popularBody}>
        <Text style={styles.popularTitle} numberOfLines={1}>
          {course.title}
        </Text>
               <View style={styles.popularMetaRow}>
          {!!dur && (
            <View style={styles.metaItem}>
              <Clock size={wp(13)} color={colors.uSubHeading} strokeWidth={2} />
              <Text style={styles.metaText}>{dur}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <PlayCircle size={wp(13)} color={colors.uSubHeading} strokeWidth={2} />
            <Text style={styles.metaText}>
              {course.videos?.length ?? course.total_videos ?? 0} Lessons
            </Text>
          </View>
          {!!rating && (
            <View style={styles.metaItem}>
              <Star size={wp(13)} color={colors.uSubHeading} fill={colors.uSubHeading} />
              <Text style={styles.metaText}>{rating}</Text>
            </View>
          )}
        </View>

        {(course.total_students ?? course.enrolled_count) != null && (
          <View style={[styles.metaItem, { marginBottom: hp(10) }]}>
            <Users size={wp(13)} color={colors.uSubHeading} strokeWidth={2} />
            <Text style={styles.metaText}>
              {fmtCount(course.total_students ?? course.enrolled_count)} Enrolled
            </Text>
          </View>
        )}

        <View style={styles.popularFooter}>
          <View>
            <Text style={styles.popularPrice}>{fmtPrice(course.price)}</Text>
            <View style={styles.creatorRow}>
              <UserIcon size={wp(11)} color={colors.uSubHeading} strokeWidth={2} />
              <Text style={styles.creatorText} numberOfLines={1}>
                by {course.creator?.name || 'Creator'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.enrollBtn}
            activeOpacity={0.85}
            onPress={() => openCourse(course)}
          >
            <Text style={styles.enrollBtnText}>Enroll Now</Text>
            <ArrowRight size={wp(13)} color={colors.user.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

  const renderWebinar = ({ item: webinar }: any) => (
    <TouchableOpacity
      style={styles.webinarCard}
      activeOpacity={0.9}
      onPress={() => openWebinar(webinar)}
    >
      <View style={styles.webinarImageWrap}>
        {webinar.thumbnail_url ? (
          <Image source={{ uri: webinar.thumbnail_url }} style={styles.webinarImage}resizeMode='contain' />
        ) : (
          <View style={[styles.webinarImage, styles.imgPlaceholder]}>
            <Play size={wp(30)} color={colors.user.text} strokeWidth={1.5} />
          </View>
        )}
        <Text style={styles.webinarPriceOverlay}>{fmtPrice(webinar.price)}</Text>
      </View>

      <View style={styles.webinarBody}>
        <Text style={styles.webinarTitle} numberOfLines={2}>
          {webinar.title}
        </Text>
        {!!webinar.description && (
          <Text style={styles.webinarDesc} numberOfLines={1}>
            {webinar.description}
          </Text>
        )}

        <View style={styles.webinarInfoRow}>
          <View style={styles.metaItem}>
            <Calendar size={wp(13)} color={colors.user.text} strokeWidth={2} />
            <Text style={styles.metaText}>{fmtDateTime(webinar.scheduled_at)}</Text>
          </View>
          <View style={styles.metaItem}>
            <UserIcon size={wp(13)} color={colors.user.text} strokeWidth={2} />
            <Text style={styles.metaText} numberOfLines={1}>
              {webinar.creator?.name || 'Host'}
            </Text>
          </View>
        </View>

          <View style={styles.registerBtn}>
          <PlayCircle size={wp(16)} color={colors.user.text} strokeWidth={2} />
          <Text style={styles.registerBtnText}>Register Now</Text>
          <ArrowRight size={wp(14)} color={colors.user.text} strokeWidth={2.4} />
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ─────────── List header (search + toggle + tab intro) ─────────── */
  const ListHeader = (
    <View>
      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={wp(18)} color={colors.user.text} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search webinars, topics, or experts..."
          placeholderTextColor={colors.user.subHeading}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {tabLoading && !refreshing && (
          <ActivityIndicator size="small" color={colors.user.subHeading} />
        )}
      </View>

      {/* Toggle */}
      <View style={styles.toggleRow}>
        {(['Courses', 'Webinars'] as Tab[]).map(tab => {
          const active = activeTab === tab;
          const Icon = tab === 'Courses' ? BookOpen : Play;
          const inner = (
            <View style={styles.togglePillInner}>
              <Icon
                size={wp(16)}
                color={active ? colors.user.text : colors.user.subHeading}
                strokeWidth={2}
                fill={tab === 'Webinars' && active ? colors.user.text : 'transparent'}
              />
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{tab}</Text>
            </View>
          );
          return (
            <TouchableOpacity
              key={tab}
              style={styles.toggleTouchable}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab)}
            >
              {active ? (
                <LinearGradient
                  colors={['#86EFAC', '#4ADE80']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.togglePill}
                >
                  {inner}
                </LinearGradient>
              ) : (
                <View style={[styles.togglePill, styles.togglePillInactive]}>{inner}</View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Courses: featured card + section title */}
      {isCourses ? (
        <>
          {featured && (
            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.9}
              onPress={() => openCourse(featured)}
            >
              <View style={styles.featuredTopRow}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>FEATURED</Text>
                </View>
                {!!(featured.average_rating || featured.rating) && (
                  <View style={styles.ratingRow}>
                    <Star size={wp(13)} color={colors.gold} fill={colors.gold} />
                    <Text style={styles.ratingText}>
                      {featured.average_rating || featured.rating}
                    </Text>
                  </View>
                )}
              </View>

                           <Text style={styles.featuredTitle} numberOfLines={2}>
                {featured.title}
              </Text>
              <Text style={styles.featuredDesc} numberOfLines={2}>
                {featured.description || 'Start learning today.'}
              </Text>

              <View style={styles.statsRow}>
                {!!courseDuration(featured) && (
                  <View style={styles.statItem}>
                    <Clock size={wp(14)} color={colors.user.subHeading} strokeWidth={2} />
                    <Text style={styles.statText}>{courseDuration(featured)}</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <PlayCircle size={wp(14)} color={colors.user.subHeading} strokeWidth={2} />
                  <Text style={styles.statText}>
                    {featured.videos?.length ?? featured.total_videos ?? 0} Lessons
                  </Text>
                </View>
                {(featured.total_students ?? featured.enrolled_count) != null && (
                  <View style={styles.statItem}>
                    <Users size={wp(14)} color={colors.user.subHeading} strokeWidth={2} />
                    <Text style={styles.statText}>
                      {fmtCount(featured.total_students ?? featured.enrolled_count)} Enrolled
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.featuredFooter}>
                <View style={styles.featuredPriceCol}>
                  <Text style={styles.featuredPrice}>{fmtPrice(featured.price)}</Text>
                  {!!(featured.original_price || featured.mrp) &&
                    Number(featured.original_price || featured.mrp) >
                      Number(featured.price || 0) && (
                      <Text style={styles.featuredStrike}>
                        ₹{Number(featured.original_price || featured.mrp).toLocaleString('en-IN')}
                      </Text>
                    )}
                  <View style={styles.creatorRow}>
                    <UserIcon size={wp(12)} color={colors.user.subHeading} strokeWidth={2} />
                    <Text style={styles.creatorText} numberOfLines={1}>
                      by {featured.creator?.name || 'Creator'}
                    </Text>
                  </View>
                </View>
                <View style={styles.enrollBtn}>
                  <Text style={styles.enrollBtnText}>Enroll Now</Text>
                  <ArrowRight size={wp(14)} color={colors.user.text} strokeWidth={2.4} />
                </View>
              </View>

              {featured.thumbnail ? (
                <Image source={{ uri: featured.thumbnail }} style={styles.featuredImage} resizeMode='contain' />
              ) : (
                <View style={[styles.featuredImage, styles.imgPlaceholder]}>
                  <BookOpen size={wp(34)} color={colors.user.text} strokeWidth={1.4} />
                </View>
              )}
            </TouchableOpacity>
          )}
          {tabCount > 0 && <Text style={styles.bigSectionTitle}>Popular Courses</Text>}
        </>
      ) : (
        <View style={styles.webinarHeadRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigSectionTitle}>Upcoming Webinars</Text>
            <Text style={styles.webinarSubtitle}>Handpicked sessions for your path</Text>
          </View>
          <View style={styles.upcomingPill}>
            <Text style={styles.upcomingPillText}>• {webinars.length} upcoming</Text>
          </View>
        </View>
      )}
    </View>
  );

  const ListEmpty = () => {
    if (tabLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={colors.greenButton}
          style={{ marginVertical: hp(28) }}
        />
      );
    }
    return (
      <Text style={styles.emptyText}>
        {isCourses
          ? debouncedQuery
            ? 'No courses match your search.'
            : 'No courses found.'
          : debouncedQuery
          ? 'No webinars match your search.'
          : 'No upcoming webinars right now.'}
      </Text>
    );
  };

  const ListFooter = tabLoadingMore ? (
    <ActivityIndicator
      size="small"
      color={colors.greenButton}
      style={{ marginVertical: hp(18) }}
    />
  ) : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(6) }]}>
        <Text style={styles.headerTitle}>Explore Detail</Text>
      </View>

      {!firstLoadDone ? (
        <ExploreSkeleton />
      ) : (
      <FlatList
        data={listData}
        keyExtractor={(item: any, index) => String(item?.id || item?._id || index)}
        renderItem={isCourses ? renderCourse : renderWebinar}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={tabCount === 0 ? ListEmpty : null}
        ListFooterComponent={ListFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.greenButton}
            colors={[colors.greenButton]}
          />
        }
      />
      )}
    </View>
  );
};

export default ExploreDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.user.bg,
  },
  scrollContent: {
    paddingHorizontal: wp(18),
    paddingBottom: hp(36),
    flexGrow: 1,
  },
  

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(18),
    paddingBottom: hp(14),
    backgroundColor: colors.user.bg,
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
  },

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.user.cardSoft,
    borderRadius: wp(14),
    paddingHorizontal: wp(16),
    height: hp(50),
    gap: wp(10),
    marginTop: hp(8),
    marginBottom: hp(16),
  },
  searchInput: {
    flex: 1,
    color: colors.user.accentText,
    fontSize: fp(13.5),
    padding: 0,
  },

  /* Toggle */
  toggleRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(20),
  },
  toggleTouchable: {
    flex: 1,
    borderRadius: wp(14),
    overflow: 'hidden',
  },
  togglePill: {
    borderRadius: wp(14),
    paddingVertical: hp(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePillInactive: {
    backgroundColor: colors.user.card,
  },
  togglePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  toggleText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.user.subHeading,
  },
  toggleTextActive: {
    color: colors.user.accentText,
  },

  /* Shared */
  imgPlaceholder: {
    backgroundColor: colors.greenButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    textAlign: 'center',
    marginVertical: hp(28),
  },
  bigSectionTitle: {
    fontSize: fp(21),
    fontWeight: '800',
    color: colors.user.text,
    marginBottom: hp(14),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  metaText: {
    fontSize: fp(12),
    color: colors.user.subHeading,
    fontWeight: '500',
  },

  /* Featured card */
  featuredCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(18),
    padding: wp(16),
    marginBottom: hp(26),
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  featuredBadge: {
    backgroundColor: 'rgba(240,192,64,0.14)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(6),
  },
  featuredBadgeText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  ratingText: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.user.text,
  },
  featuredTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.user.text,
    lineHeight: fp(24),
    marginBottom: hp(6),
  },
  featuredDesc: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    lineHeight: fp(18),
    marginBottom: hp(16),
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(16),
  },
  featuredPriceCol: {
    flex: 1,
  },
  featuredPrice: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.user.accentText,
  },
  featuredStrike: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    textDecorationLine: 'line-through',
    marginTop: hp(2),
  },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: colors.user.accent,
    paddingHorizontal: wp(18),
    paddingVertical: hp(11),
    borderRadius: wp(12),
  },
  enrollBtnText: {
    fontSize: fp(13.5),
    fontWeight: '800',
    color: colors.user.text,
  },
  featuredImage: {
    width: '100%',
    height: hp(96),
    borderRadius: wp(12),
    backgroundColor: colors.user.cardSoft
  },

  /* Popular course card */
  popularCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(18),
    overflow: 'hidden',
    marginBottom: hp(16),
  },
  popularImageWrap: {
    position: 'relative',
    backgroundColor: colors.user.cardSoft,
  },
  popularImage: {
    width: '100%',
    height: hp(150),
  },
  levelBadge: {
    position: 'absolute',
    top: wp(12),
    left: wp(12),
    backgroundColor: colors.user.accent,
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  levelBadgeText: {
    fontSize: fp(11.5),
    fontWeight: '700',
    color: colors.user.text,
  },
  popularBody: {
    padding: wp(16),
  },
  popularTitle: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.user.text,
    marginBottom: hp(8),
  },
  popularMetaRow: {
    flexDirection: 'row',
    gap: wp(16),
    marginBottom: hp(10),
  },
  popularPrice: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.user.text,
  },
   popularFooter: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
},

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(14),
    marginBottom: hp(14),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  statText: {
    fontSize: fp(12),
    color: colors.user.subHeading,
    fontWeight: '500',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(4),
  },
  creatorText: {
    fontSize: fp(11.5),
    color: colors.user.subHeading,
    fontWeight: '500',
  },

  /* Webinars */
  webinarHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: hp(16),
  },
  webinarSubtitle: {
    fontSize: fp(12.5),
    color: colors.user.accentText,
    marginTop: -hp(6),
  },
  upcomingPill: {
    backgroundColor: colors.user.cardSoft,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(20),
    marginTop: hp(2),
  },
  upcomingPillText: {
    fontSize: fp(11.5),
    fontWeight: '600',
    color: colors.user.accentText,
  },
  webinarCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(18),
    overflow: 'hidden',
    marginBottom: hp(18),
  },
  webinarImageWrap: {
    position: 'relative',
    backgroundColor: colors.user.cardSoft,
  },
  webinarImage: {
    width: '100%',
    height: hp(150),
  },
  webinarPriceOverlay: {
    position: 'absolute',
    top: hp(12),
    right: wp(14),
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.user.accent,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  webinarBody: {
    padding: wp(16),
  },
  webinarTitle: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.user.text,
    lineHeight: fp(22),
    marginBottom: hp(6),
  },
  webinarDesc: {
    fontSize: fp(12.5),
    color: colors.user.accentText,
    marginBottom: hp(12),
  },
  webinarInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(14),
    gap: wp(10),
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: colors.user.accent,
    borderRadius: wp(12),
    paddingVertical: hp(13),
  },
  registerBtnText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.user.text,
  },
});
