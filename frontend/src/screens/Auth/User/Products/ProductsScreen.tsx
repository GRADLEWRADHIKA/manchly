// screens/Auth/User/Products/ProductsScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput, ActivityIndicator,
  Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Star, BookOpen, Video, ArrowLeft } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import { listExperts } from '../../../../store/SessionSlice';
import LinearGradient from 'react-native-linear-gradient';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const fmtPrice = (p: any) => (Number(p) > 0 ? `₹${p}` : 'Free');

const fmtDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const initials = (name?: string) =>
  (name || '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const ProductsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const insets = useSafeAreaInsets();
  const focus = useIsFocused();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Courses' | 'Webinars'>(
    route.params?.initialTab === 'Webinars' ? 'Webinars' : 'Courses',
  );

  // Switch to the requested tab when navigated here from Home "See All"
  useEffect(() => {
    const t = route.params?.initialTab;
    if (t === 'Courses' || t === 'Webinars') setActiveFilter(t);
  }, [route.params?.initialTab, route.params?.ts]);
  const [webinars, setWebinars] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [loadingWebinars, setLoadingWebinars] = useState(false);

  const { list: allCourses } = useSelector((state: any) => state.coursesReducer);
  const courses = allCourses?.data?.courses || [];

  useEffect(() => {
    if (!focus) return;

    dispatch(fetchCourses({}));

    dispatch(listExperts({ page: 1, limit: 10 }))
      .unwrap()
      .then((res: any) => setExperts(res?.data?.experts || []))
      .catch(() => {});

    setLoadingWebinars(true);
    dispatch(getAllWebinar({ page: 1, limit: 10, upcoming: true, title: '' }))
      .unwrap()
      .then((res: any) => {
        const all = res?.data?.data?.webinars || [];
        setWebinars(all.filter((w: any) => !w.is_enrolled));
      })
      .catch(() => {})
      .finally(() => setLoadingWebinars(false));
  }, [focus]);

  const q = searchQuery.trim().toLowerCase();

  const filteredCourses = useMemo(
    () =>
      q
        ? courses.filter((c: any) => (c?.title || '').toLowerCase().includes(q))
        : courses,
    [courses, q],
  );

  const filteredWebinars = useMemo(
    () =>
      q
        ? webinars.filter((w: any) => (w?.title || '').toLowerCase().includes(q))
        : webinars,
    [webinars, q],
  );

  const featured = filteredCourses[0];
  const popular = filteredCourses.slice(1);

  const openCourse = (course: any) =>
    navigation.navigate('CourseDetailsScreen', {
      courseId: course?.id,
      videoList: course?.videos,
    });
  const openWebinar = (webinar: any) =>
    navigation.navigate('WebinarDetails', { data: webinar });
  const openExpert = (expert: any) =>
    navigation.navigate('ExpertDetail', { expert });

  const SearchBar = (
    <View style={styles.searchBar}>
      <Search size={16} color={colors.user.accent} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search courses, webinars, or experts..."
        placeholderTextColor={colors.user.subHeading}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  // ── Segmented Tabs (matches PurchasesScreen.tsx SegmentedTabs) ──
  const slideAnim = useRef(
    new Animated.Value(activeFilter === 'Courses' ? 0 : 1),
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeFilter === 'Courses' ? 0 : 1,
      useNativeDriver: true,
      friction: 10,
      tension: 140,
    }).start();
  }, [activeFilter]);

  const tabTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, wp(164)],
  });

  const FilterRow = (
    <View style={styles.tabWrapper}>
      <View style={styles.tabTrack}>
        <Animated.View
          style={[
            styles.tabIndicatorContainer,
            { transform: [{ translateX: tabTranslateX }] },
          ]}
        >
          <LinearGradient
            colors={['#86EFAC', '#4ADE80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradientIndicator}
          />
        </Animated.View>

        {(['Courses', 'Webinars'] as const).map(filter => {
          const isActive = activeFilter === filter;
          const Icon = filter === 'Courses' ? BookOpen : Video;
          const count =
            filter === 'Courses' ? filteredCourses.length : filteredWebinars.length;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setActiveFilter(filter);
              }}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <Icon
                size={wp(16)}
                color={isActive ? colors.white : colors.uSubHeading}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {filter}
              </Text>
              {count > 0 && (
                <View
                  style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}
                >
                  <Text
                    style={[styles.tabCountText, isActive && styles.tabCountTextActive]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const ExpertsRail = experts.length > 0 && (
    <>
      <View style={[styles.sectionHeader, { marginTop: hp(24) }]}>
        <Text style={styles.sectionTitle}>Learn from the Best</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ExpertList')}
        >
          <Text style={styles.seeAllText}>See All →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: wp(12) }}
      >
        {experts.map(expert => {
          const u = expert.user || {};
          return (
            <TouchableOpacity
              key={expert.id}
              style={[styles.facultyCircularCard, { width: wp(140) }]}
              activeOpacity={0.85}
              onPress={() => openExpert(expert)}
            >
              {u.profile_image ? (
                <Image
                  source={{ uri: u.profile_image }}
                  style={styles.facultyImageCircle}
                />
              ) : (
                <View style={[styles.facultyImageCircle, styles.imgPlaceholder]}>
                  <Text style={styles.avatarInitials}>{initials(u.name)}</Text>
                </View>
              )}
              <Text style={styles.facultyCardName} numberOfLines={1}>
                {u.name || 'Expert'}
              </Text>
              <Text style={styles.facultyCardRole} numberOfLines={1}>
                {expert.profession || 'Expert'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={wp(22)} color={colors.user.subHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Detail</Text>
        <View style={{ width: wp(22) }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeFilter === 'Courses' ? (
          <>
            {SearchBar}
            {FilterRow}

            {/* Featured Course */}
            {featured && (
              <TouchableOpacity
                style={styles.featuredCourseCard}
                activeOpacity={0.85}
                onPress={() => openCourse(featured)}
              >
                <View style={styles.featuredContentRow}>
                  <View style={styles.featuredTextContent}>
                    <View style={styles.badgeRow}>
                      <View style={styles.featuredAccentBadge}>
                        <Text style={styles.featuredAccentBadgeText}>FEATURED</Text>
                      </View>
                      {!!(featured.average_rating || featured.rating) && (
                        <View style={styles.starMetaRow}>
                          <Star size={10} color={colors.gold} fill={colors.gold} />
                          <Text style={styles.featuredMetaText}>
                            {featured.average_rating || featured.rating}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.featuredCourseTitle} numberOfLines={2}>
                      {featured.title}
                    </Text>
                    <Text style={styles.featuredCourseDesc} numberOfLines={3}>
                      {featured.description || 'Start learning today.'}
                    </Text>

                    <View style={styles.featuredActionFooter}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.featuredCoursePrice}>
                          {fmtPrice(featured.price)}
                        </Text>
                        {!!featured.creator?.name && (
                          <Text style={styles.featuredMetaText} numberOfLines={1}>
                            by {featured.creator.name}
                          </Text>
                        )}
                      </View>
                      <View style={styles.enrollBtn}>
                        <Text style={styles.enrollBtnText}>Enroll Now</Text>
                      </View>
                    </View>
                  </View>

                  {featured.thumbnail ? (
                    <Image
                      source={{ uri: featured.thumbnail }}
                      style={styles.featuredSideImage}
                    />
                  ) : (
                    <View style={[styles.featuredSideImage, styles.imgPlaceholder]}>
                      <BookOpen
                        size={wp(30)}
                        color={colors.cAccentLight}
                        strokeWidth={1.6}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Popular Courses */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Courses</Text>
            </View>

            {filteredCourses.length === 0 ? (
              <Text style={styles.emptyText}>No courses found.</Text>
            ) : (
              popular.map((course: any) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.popularCourseCard}
                  activeOpacity={0.8}
                  onPress={() => openCourse(course)}
                >
                  {course.thumbnail ? (
                    <Image
                      source={{ uri: course.thumbnail }}
                      style={styles.courseThumbnailImage}
                    />
                  ) : (
                    <View
                      style={[styles.courseThumbnailImage, styles.imgPlaceholder]}
                    >
                      <BookOpen
                        size={wp(24)}
                        color={colors.cAccentLight}
                        strokeWidth={1.6}
                      />
                    </View>
                  )}
                  <View style={styles.popularCourseCardInfo}>
                    {!!course.category && (
                      <View style={styles.pillBadgeContainer}>
                        <Text style={styles.pillBadgeText}>
                          {String(course.category).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.popularCourseTitle} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={styles.courseDurationText}>
                      {course.duration ? `🕒 ${course.duration}h  ` : ''}
                      {course.average_rating || course.rating
                        ? `★ ${course.average_rating || course.rating}`
                        : ''}
                    </Text>
                    <View style={styles.courseBottomActionRow}>
                      <Text style={styles.coursePriceTag}>
                        {fmtPrice(course.price)}
                      </Text>
                      <View style={styles.addButtonCircle}>
                        <Text style={styles.addButtonText}>+</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {ExpertsRail}
          </>
        ) : (
          <>
            {/* Webinar Hero */}
            <View style={styles.webinarWelcomeHeroCard}>
              <Text style={styles.webinarHeroGreeting}>Hey 👋</Text>
              <Text style={styles.webinarHeroTitle}>Join Live Webinars</Text>
              <Text style={styles.webinarHeroDesc}>
                Attend live sessions with world-class experts and scale your
                knowledge in real-time.
              </Text>
            </View>

            {SearchBar}
            {FilterRow}

            {/* Upcoming Webinars */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Webinars</Text>
              <View style={styles.upcomingCountBadge}>
                <Text style={styles.upcomingCountText}>
                  • {filteredWebinars.length} upcoming
                </Text>
              </View>
            </View>

            {loadingWebinars ? (
              <ActivityIndicator
                size="small"
                color={colors.cAccentLight}
                style={{ marginVertical: hp(20) }}
              />
            ) : filteredWebinars.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming webinars right now.</Text>
            ) : (
              filteredWebinars.map((webinar: any) => (
                <TouchableOpacity
                  key={webinar.id}
                  style={styles.webinarItemCard}
                  activeOpacity={0.85}
                  onPress={() => openWebinar(webinar)}
                >
                  <View style={{ position: 'relative' }}>
                    {webinar.thumbnail_url ? (
                      <Image
                        source={{ uri: webinar.thumbnail_url }}
                        style={styles.webinarCoverImage}
                      />
                    ) : (
                      <View style={[styles.webinarCoverImage, styles.imgPlaceholder]}>
                        <Video
                          size={wp(30)}
                          color={colors.cAccentLight}
                          strokeWidth={1.6}
                        />
                      </View>
                    )}
                    <View style={styles.priceOverlayBadge}>
                      <Text style={styles.priceOverlayText}>
                        {fmtPrice(webinar.price)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.webinarDetailsContent}>
                    <Text style={styles.webinarItemTitle} numberOfLines={2}>
                      {webinar.title}
                    </Text>
                    {!!webinar.description && (
                      <Text style={styles.webinarItemDesc} numberOfLines={2}>
                        {webinar.description}
                      </Text>
                    )}
                    <Text style={styles.webinarMetaLineText}>
                      📅 {fmtDateTime(webinar.scheduled_at)}
                    </Text>
                    <Text style={styles.webinarMetaLineText}>
                      👤 {webinar.creator?.name || 'Host'}
                    </Text>
                    <View style={styles.registerWebinarBtn}>
                      <Text style={styles.registerWebinarBtnText}>Register Now</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {ExpertsRail}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.user.bg,
  },
  headerTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.user.text
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(30),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.user.bg,
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
  },
  iconButton: {
    padding: wp(4),
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp(4),
    right: wp(4),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.user.accent,
  },
  heroTitle: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.user.text,
    marginTop: hp(16),
    marginBottom: hp(14),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.user.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.user.cardSoft,
    paddingHorizontal: wp(14),
    height: hp(44),
    gap: wp(10),
    marginBottom: hp(16),
  },
  searchInput: {
    flex: 1,
    color: colors.user.accentText,
    fontSize: fp(13),
  },

  // ── Segmented Tabs ──
  tabWrapper: {
    marginBottom: hp(20),
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(4),
    position: 'relative',
  },
  tabIndicatorContainer: {
    position: 'absolute',
    top: wp(4),
    bottom: wp(4),
    left: wp(4),
    width: wp(160),
    shadowColor: colors.greenButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabGradientIndicator: {
    flex: 1,
    borderRadius: wp(11),
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    gap: wp(6),
    zIndex: 1,
  },
  tabLabel: {
    fontSize: fp(13.5),
    fontWeight: '500',
    color: colors.user.subHeading,
  },
  tabLabelActive: {
    color: colors.user.accentText,
    fontWeight: '600',
  },
  tabCountBadge: {
    backgroundColor: colors.user.accentText,
    borderRadius: wp(10),
    paddingHorizontal: wp(7),
    paddingVertical: hp(1),
    minWidth: wp(22),
    alignItems: 'center',
  },
  tabCountBadgeActive: {
    backgroundColor: colors.user.cardSoft,
  },
  tabCountText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.user.subHeading,
  },
  tabCountTextActive: {
    color: colors.user.text,
  },

  imgPlaceholder: {
    backgroundColor: colors.greenButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.user.subHeading,
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.user.accentText,
    textAlign: 'center',
    marginVertical: hp(24),
  },

  // Featured Course
  featuredCourseCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.user.card,
    overflow: 'hidden',
    marginBottom: hp(24),
    padding: wp(14),
  },
  featuredContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: wp(12),
  },
  featuredTextContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(8),
  },
  featuredAccentBadge: {
    backgroundColor: colors.goldDim,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: 6,
  },
  featuredAccentBadgeText: {
    fontSize: fp(9),
    color: colors.gold,
    fontWeight: '700',
  },
  starMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  featuredMetaText: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    fontWeight: '600',
  },
  featuredCourseTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.user.text,
    lineHeight: fp(20),
    marginBottom: hp(6),
  },
  featuredCourseDesc: {
    fontSize: fp(11),
    color: colors.user.accentText,
    lineHeight: fp(16),
    marginBottom: hp(14),
  },
  featuredActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  featuredCoursePrice: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.user.text,
  },
  enrollBtn: {
    backgroundColor: colors.user.accent,
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: 8,
  },
  enrollBtnText: {
    color: colors.user.nav,
    fontSize: fp(12),
    fontWeight: '700',
  },
  featuredSideImage: {
    width: wp(100),
    height: hp(130),
    borderRadius: 10,
  },

  // Popular Course
  popularCourseCard: {
    flexDirection: 'row',
    backgroundColor: colors.user.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.user.card,
    padding: wp(10),
    gap: wp(12),
    marginBottom: hp(12),
    alignItems: 'center',
  },
  courseThumbnailImage: {
    width: wp(80),
    height: wp(80),
    borderRadius: 10,
  },
  popularCourseCardInfo: {
    flex: 1,
  },
  pillBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor:colors.user.accent,
    borderRadius: 4,
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    marginBottom: hp(4),
  },
  pillBadgeText: {
    fontSize: fp(8),
    color: colors.user.nav,
    fontWeight: '700',
  },
  popularCourseTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.user.text,
    marginBottom: hp(4),
  },
  courseDurationText: {
    fontSize: fp(10),
    color: colors.user.accentText,
    marginBottom: hp(6),
  },
  courseBottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coursePriceTag: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.user.accent,
  },
  addButtonCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.user.bg
  },
  addButtonText: {
    color: colors.user.text,
    fontSize: fp(14),
    lineHeight: fp(16),
  },

  // Webinar
  webinarWelcomeHeroCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    padding: wp(16),
    marginTop: hp(16),
    marginBottom: hp(16),
  },
  webinarHeroGreeting: {
    fontSize: fp(11),
    color: colors.gold,
    fontWeight: '600',
    marginBottom: hp(4),
  },
  webinarHeroTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
    marginBottom: hp(6),
  },
  webinarHeroDesc: {
    fontSize: fp(12),
    color: colors.user.accentText,
    lineHeight: fp(17),
  },
  upcomingCountBadge: {
    backgroundColor: colors.user.accent,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: 6,
  },
  upcomingCountText: {
    fontSize: fp(10),
    color: colors.user.nav,
    fontWeight: '600',
  },
  webinarItemCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.user.card,
    overflow: 'hidden',
    marginBottom: hp(16),
  },
  webinarCoverImage: {
    width: '100%',
    height: hp(130),
  },
  priceOverlayBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: 6,
  },
  priceOverlayText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '700',
  },
  webinarDetailsContent: {
    padding: wp(14),
  },
  webinarItemTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.user.text,
    marginBottom: hp(4),
  },
  webinarItemDesc: {
    fontSize: fp(11),
    color: colors.user.accentText,
    lineHeight: fp(16),
    marginBottom: hp(10),
  },
  webinarMetaLineText: {
    fontSize: fp(11),
    color: colors.user.accent,
    marginBottom: hp(4),
  },
  registerWebinarBtn: {
    backgroundColor: colors.greenButton,
    borderWidth: 1,
    borderColor: colors.greenButton,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    marginTop: hp(12),
  },
  registerWebinarBtnText: {
    color: colors.user.accentText,
    fontSize: fp(12),
    fontWeight: '600',
  },

  // Faculty / Experts
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(14),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.user.text,
  },
  seeAllText: {
    fontSize: fp(12),
    color: colors.user.accent,
  },
  facultyCircularCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    padding: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.user.card,
  },
  facultyImageCircle: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    marginBottom: hp(10),
  },
  facultyCardName: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.user.accentText,
  },
  facultyCardRole: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    marginTop: hp(2),
  },
});