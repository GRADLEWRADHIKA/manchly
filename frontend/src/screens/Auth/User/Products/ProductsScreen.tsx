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
import { Search, Star, BookOpen, Video, ArrowLeft, Clock, Calendar, MapPin } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import { listExperts, getPopularSessionProducts } from '../../../../store/SessionSlice';
import ButtonSection from './component/ButtonSection';
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

const fmtCourseDuration = (totalSeconds?: number) => {
  if(!totalSeconds) return '';
  const hours = Math.floor(totalSeconds/ 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

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

  const searchTimer = useRef<any>(null);
  const [activeFilter, setActiveFilter] = useState<'courses' | 'webinar' | 'sessions'>(
    route.params?.initialTab === 'Webinars'
      ? 'webinar'
      : route.params?.initialTab === 'Sessions'
      ? 'sessions'
      : 'courses',
  );

  // Switch to the requested tab when navigated here from Home "See All"
  useEffect(() => {
    const t = route.params?.initialTab;
    if (t === 'Courses') setActiveFilter('courses');
    else if (t === 'Webinars') setActiveFilter('webinar');
    else if (t === 'Sessions') setActiveFilter('sessions');
  }, [route.params?.initialTab, route.params?.ts]);

  const [webinars, setWebinars] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [loadingWebinars, setLoadingWebinars] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { list: allCourses } = useSelector((state: any) => state.coursesReducer);
  const courses = allCourses?.data?.courses || [];
  const { popularProducts: sessionProducts, popularProductsLoading: sessionsLoading } =
    useSelector((state: any) => state.sessionReducer);

     const fetchCourseResults = (search: string) => {
    const payload: any = { page: 1, limit: 10 };
    if (search.trim()) payload.search = search.trim();
    dispatch(fetchCourses(payload));
  };

  const fetchWebinarResults = (search: string) => {
    setLoadingWebinars(true);
    const payload: any = { page: 1, limit: 10, upcoming: true };
    if (search.trim()) payload.search = search.trim();
    dispatch(getAllWebinar(payload))
      .unwrap()
      .then((res: any) => {
        const all = res?.data?.data?.webinars || [];
        setWebinars(all.filter((w: any) => !w.is_enrolled));
      })
      .catch(() => {})
      .finally(() => setLoadingWebinars(false));
  };
  useEffect(() => {
    if (!focus) return;

    fetchCourseResults('');

    dispatch(listExperts({ page: 1, limit: 10 }))
      .unwrap()
      .then((res: any) => setExperts(res?.data?.experts || []))
      .catch(() => {});

    fetchWebinarResults('');

    dispatch(getPopularSessionProducts({ limit: 10 }));
  }, [focus]) 
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchCourseResults(text);
      fetchWebinarResults(text);
      // Sessions has no backend search param — filtered client-side below
    }, 500);
  };
  

  const q = searchQuery.trim().toLowerCase();

  // Courses & webinars are now search-filtered server-side (see handleSearchChange)
  const filteredCourses = courses;
  const filteredWebinars = webinars;

  const filteredSessionProducts = useMemo(
    () => 
      q 
    ? (sessionProducts || []).filter((p:any) => 
    (p?.title || '').toLowerCase().includes(q)
  )
  :sessionProducts || [],
  [sessionProducts,q],
  );

  const featuredCourse = 
  filteredCourses.length > 0
    ?[...filteredCourses].sort(
      (a,b) => (b.total_students || 0) - (a.total_students || 0),
    )[0]
    :null;
    const popularCourses = filteredCourses.filter((c) => c.id !== featuredCourse?.id);
    const featuredWebinar = filteredWebinars[0] || null;
   const popularWebinars = filteredWebinars.filter((w) => w.id !== featuredWebinar?.id);

  const featuredSession = filteredSessionProducts?.[0] || null;
  const popularSessions = filteredSessionProducts.filter(
    (p: any) => p.id !== featuredSession?.id,
)

  const openCourse = (course: any) =>
    navigation.navigate('CourseDetailsScreen', {
      courseId: course?.id,
      videoList: course?.videos,
    });
  const openWebinar = (webinar: any) =>
    navigation.navigate('WebinarDetails', { data: webinar });
  const openExpert = (expert: any) =>
    navigation.navigate('ExpertDetail', { expert});

  const SearchBar = (
    <View style={styles.searchBar}>
      <Search size={16} color={colors.user.accent} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search courses, webinars, or experts..."
        placeholderTextColor={colors.user.subHeading}
        value={searchQuery}
        onChangeText={handleSearchChange}
      />
    </View>
  );

  // ── Segmented Tabs ──
  const slideAnim = useRef(
    new Animated.Value(activeFilter === 'courses' ? 0 : 1),
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeFilter === 'courses' ? 0 : 1,
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

        {(['courses', 'webinar'] as const).map(filter => {
          const isActive = activeFilter === filter;
          const Icon = filter === 'courses' ? BookOpen : Video;
          const count =
            filter === 'courses' ? filteredCourses.length : filteredWebinars.length;
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
                color={isActive ? colors.white : colors.textSecondary}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {filter === 'courses' ? 'Courses' : 'Webinars'}
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
        {activeFilter === 'courses' ? (
          <>
            {SearchBar}
            <ButtonSection active={activeFilter} setActive={setActiveFilter} />

            {/* Featured Course */}
            {featuredCourse && (
              <TouchableOpacity
                style={styles.featuredCourseCard}
                activeOpacity={0.85}
                onPress={() => openCourse(featuredCourse)}
              >
                <View style={styles.featuredContentRow}>
                  <View style={styles.featuredTextContent}>
                    <View style={styles.badgeRow}>
                      <View style={styles.featuredAccentBadge}>
                        <Text style={styles.featuredAccentBadgeText}>🔥 Most Enrolled</Text>
                      </View>
                    </View>

                    <Text style={styles.featuredCourseTitle} numberOfLines={2}>
                      {featuredCourse.title}
                    </Text>
                    <View style={styles.featuredMetaRow}>
                      {!!featuredCourse.total_videos && (
                        <View style={styles.starMetaRow}>
                          <BookOpen size={wp(30)} color={colors.greenButtonDark} strokeWidth={1.4} />
                          <Text style={styles.featuredMetaText}>
                            {featuredCourse.total_videos} Videos
                          </Text>
                        </View>
                      )}
                      {!!featuredCourse.level && (
                        <Text style={styles.featuredMetaText}>{featuredCourse.level}</Text>
                      )}
                      {!!fmtCourseDuration(featuredCourse.total_duration) && (
                        <View style={styles.starMetaRow}>
                          <Clock size={11} color={colors.user.subHeading} strokeWidth={1.8} />
                          <Text style={styles.featuredMetaText}>
                            {fmtCourseDuration(featuredCourse.total_duration)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.featuredActionFooter}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.featuredCoursePrice}>
                          {fmtPrice(featuredCourse.price)}
                        </Text>
                        {!!featuredCourse.creator?.name && (
                          <Text style={styles.featuredMetaText} numberOfLines={1}>
                            by {featuredCourse.creator.name}
                          </Text>
                        )}
                      </View>
                      <View style={styles.enrollBtn}>
                        <Text style={styles.enrollBtnText}>Enroll Now</Text>
                      </View>
                    </View>
                  </View>

                  {featuredCourse.thumbnail ? (
                    <Image
                      source={{ uri: featuredCourse.thumbnail }}
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
              popularCourses.map((course: any) => (
               <TouchableOpacity
               key={course.id}
               style={styles.popularCourseCardV2}
               activeOpacity={0.85}
               onPress={()=> openCourse(course)}
               >
                <View style={styles.popularCourseBannerWrap}>
                    {course.thumbnail ? (
                      <Image
                        source={{ uri: course.thumbnail }}
                        style={styles.popularCourseBanner}
                      />
                    ) : (
                    <View style={[styles.popularCourseBanner, styles.imgPlaceholder]}>
                        <BookOpen size={wp(28)} color={colors.cAccentLight} strokeWidth={1.6} />
                      </View>
                    )}
                    {!!course.level && (
                      <View style={styles.levelBadgeOverlay}>
                        <Text style={styles.pillBadgeText}>{course.level}</Text>
                      </View>
                    )}
                  </View>
                 <View style={styles.popularCourseCardInfoV2}>
                    <Text style={styles.popularCourseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>
                    {!!course.creator?.name && (
                      <Text style={styles.courseInstructorText} numberOfLines={1}>
                        by {course.creator.name}
                      </Text>
                    )}
                    <View style={styles.courseMetaRowV2}>
                      {!!course.total_videos && (
                        <View style={styles.courseMetaItem}>
                          <BookOpen size={wp(11)} color={colors.user.accentText} strokeWidth={1.8} />
                          <Text style={styles.courseDurationText}>{course.total_videos} Videos</Text>
                        </View>
                      )} 
                   {!!fmtCourseDuration(course.total_duration) && (
                        <View style={styles.courseMetaItem}>
                          <Text style={styles.courseDurationText}>
                            🕒 {fmtCourseDuration(course.total_duration)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.coursePriceTag}>{fmtPrice(course.price)}</Text>
                  </View>        
               </TouchableOpacity>
              ))
            )}

            {ExpertsRail}
          </>
        ) : activeFilter === 'webinar' ? (
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
             <ButtonSection active={activeFilter} setActive={setActiveFilter} />

            {featuredWebinar && (
              <TouchableOpacity
                style={styles.featuredCourseCard}
                activeOpacity={0.85}
                onPress={() => openWebinar(featuredWebinar)}
              >
                <View style={styles.featuredContentRow}>
                  <View style={styles.featuredTextContent}>
                    <View style={styles.badgeRow}>
                      <View style={styles.featuredAccentBadge}>
                        <Text style={styles.featuredAccentBadgeText}>▶ Upcoming Webinar</Text>
                      </View>
                    </View>
                    <Text style={styles.featuredCourseTitle} numberOfLines={2}>
                      {featuredWebinar.title}
                    </Text>
                    {!!featuredWebinar.description && (
                      <Text style={styles.featuredCourseDesc} numberOfLines={2}>
                        {featuredWebinar.description}
                      </Text>
                    )}
                    <View style={styles.featuredMetaRow}>
                      <View style={styles.starMetaRow}>
                        <Calendar size={11} color={colors.user.subHeading} strokeWidth={1.8} />
                        <Text style={styles.featuredMetaText}>
                          {fmtDateTime(featuredWebinar.scheduled_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.featuredActionFooter}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.featuredCoursePrice}>
                          {fmtPrice(featuredWebinar.price)}
                        </Text>
                        {!!featuredWebinar.creator?.name && (
                          <Text style={styles.featuredMetaText} numberOfLines={1}>
                            by {featuredWebinar.creator.name}
                          </Text>
                        )}
                      </View>
                      <View style={styles.enrollBtn}>
                        <Text style={styles.enrollBtnText}>View Details</Text>
                      </View>
                    </View>
                  </View>
                  {featuredWebinar.thumbnail_url ? (
                    <Image
                      source={{ uri: featuredWebinar.thumbnail_url }}
                      style={styles.featuredSideImage}
                    />
                  ) : (
                    <View style={[styles.featuredSideImage, styles.imgPlaceholder]}>
                      <Video size={wp(30)} color={colors.greenButtonDark} strokeWidth={1.6} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}

       
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
        ) : (
          <>
            {/* 1:1 Sessions */}
                        {SearchBar}
             <ButtonSection active={activeFilter} setActive={setActiveFilter} />

            {featuredSession && (
              <TouchableOpacity
                style={styles.featuredCourseCard}
                activeOpacity={0.85}
                onPress={() =>
                  featuredSession?.expert_id &&
                 navigation.navigate('ExpertDetail', {
                    expert: { id: featuredSession.expert_id },
                  })
                }
              >
                <View style={styles.featuredContentRow}>
                  <View style={styles.featuredTextContent}>
                    <View style={styles.badgeRow}>
                     <View style={styles.featuredAccentBadge}>
                        <Text style={styles.featuredAccentBadgeText}>⭐ 1:1 Session</Text>
                      </View>
                    </View>
                    <Text style={styles.featuredCourseTitle} numberOfLines={2}>
                      {featuredSession.title}
                    </Text>
                    {!!featuredSession.description && (
                      <Text style={styles.featuredCourseDesc} numberOfLines={2}>
                        {featuredSession.description}
                      </Text>
                    )}
                    <View style={styles.featuredMetaRow}>
                      <View style={styles.starMetaRow}>
                        <Clock size={11} color={colors.user.subHeading} strokeWidth={1.8} />
                        <Text style={styles.featuredMetaText}>{featuredSession.duration} min</Text>
                      </View>
                      <View style={styles.starMetaRow}>
                        <MapPin size={11} color={colors.user.subHeading} strokeWidth={1.8} />
                        <Text style={styles.featuredMetaText}>
                          {featuredSession.mode === 'VIDEO' ? 'Video Call' : 'Audio Call'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.featuredActionFooter}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.featuredCoursePrice}>
                          {fmtPrice(featuredSession.price)}
                        </Text>
                        {!!featuredSession.creator?.name && (
                          <Text style={styles.featuredMetaText} numberOfLines={1}>
                            by {featuredSession.creator.name}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[styles.enrollBtn, !featuredSession?.expert_id && { opacity: 0.4 }]}
                      >
                        <Text style={styles.enrollBtnText}>Book Session</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.featuredSideImage, styles.imgPlaceholder]}>
                    <Star size={wp(30)} color={colors.greenButtonDark} strokeWidth={1.6} />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular 1:1 Sessions</Text>
              <View style={styles.upcomingCountBadge}>
                <Text style={styles.upcomingCountText}>
                   • {filteredSessionProducts.length} available
                </Text>
              </View>
            </View>

            {sessionsLoading && filteredSessionProducts.length === 0 ? (
              <ActivityIndicator
                size="small"
                color={colors.greenButtonDark}
                style={{ marginVertical: hp(20) }}
              />
            ) : filteredSessionProducts.length === 0 ? (
              <Text style={styles.emptyText}>
                {q ? 'No sessions match your search.' : 'No sessions available right now.'}
              </Text>
            ) : (
              popularSessions.map((product: any) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.sessionItemCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    product?.expert_id &&
                     navigation.navigate('ExpertDetail', {
                      expert: { id: product.expert_id },
                    })
                  }
                >
                  <View style={styles.sessionIconWrap}>
                    {product.mode === 'VIDEO' ? (
                      <Video size={wp(20)} color={colors.user.accent} strokeWidth={2} />
                    ) : (
                      <Star size={wp(20)} color={colors.user.accent} strokeWidth={2} />
                    )}
                  </View>

                  <View style={styles.sessionDetailsContent}>
                    <Text style={styles.webinarItemTitle} numberOfLines={1}>
                      {product.title}
                    </Text>
                    <Text style={styles.webinarMetaLineText}>
                      {product.duration} min · {product.mode === 'VIDEO' ? 'Video Call' : 'Audio Call'}
                    </Text>
                    {!!product.creator?.name && (
                      <Text style={styles.webinarMetaLineText}>
                        by {product.creator.name}
                      </Text>
                    )}

                    <View style={styles.sessionFooterRow}>
                      <Text style={styles.coursePriceTag}>{fmtPrice(product.price)}</Text>
                      <View
                        style={[
                          styles.registerWebinarBtn,
                          styles.sessionBookBtn,
                          !product?.expert_id && { opacity: 0.4 },
                        ]}
                      >
                        <Text style={styles.registerWebinarBtnText}>Book</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
    color: colors.user.text,
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
    borderColor: colors.user.border,
    paddingHorizontal: wp(14),
    height: hp(44),
    gap: wp(10),
    marginBottom: hp(16),
  },
  searchInput: {
    flex: 1,
    color: colors.user.text,
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
    backgroundColor: colors.user.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.greenButtonDark,
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    textAlign: 'center',
    marginVertical: hp(24),
  },

  // Featured Course
  featuredCourseCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.user.border,
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
    backgroundColor: colors.user.accentSoft,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: 6,
  },
  featuredAccentBadgeText: {
    fontSize: fp(9),
    color: colors.greenButtonDark,
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
    color: colors.user.subHeading,
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
    backgroundColor: colors.greenButtonDark,
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: 8,
  },
  enrollBtnText: {
    color: '#FFFFFF' ,
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
    borderColor: colors.user.border,
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
    backgroundColor: colors.user.accent,
    borderRadius: 4,
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    marginBottom: hp(4),
  },
  pillBadgeText: {
    fontSize: fp(8),
    color: '#FFFFFF',
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
    color: colors.user.subHeading,
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
    color: colors.greenButtonDark,
  },
  addButtonCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.user.bg,
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
    color: colors.greenButtonDark,
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
    color: colors.user.subHeading,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  webinarItemCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.user.border,
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
    backgroundColor: colors.greenButtonDark,
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
    color: colors.user.subHeading,
    lineHeight: fp(16),
    marginBottom: hp(10),
  },
  webinarMetaLineText: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    marginBottom: hp(4),
  },
  registerWebinarBtn: {
    backgroundColor: colors.greenButtonDark,
    borderWidth: 1,
    borderColor: colors.greenButtonDark,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    marginTop: hp(12),
  },
  registerWebinarBtnText: {
     color: '#FFFFFF',
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
    color: colors.greenButtonDark,
  },
  facultyCircularCard: {
    backgroundColor: colors.user.card,
    borderRadius: 16,
    padding: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.user.border,
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
    color: colors.user.text,
  },
  facultyCardRole: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    marginTop: hp(2),
  },
  sessionItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.user.border,
    borderRadius: 14,
    padding: wp(12),
    gap: wp(12),
    marginBottom: hp(12),
    alignItems: 'flex-start',
  },
  sessionIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(12),
    backgroundColor: colors.user.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDetailsContent: {
    flex: 1,
  },
  sessionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(8),
  },
  sessionBookBtn: {
    marginTop: 0,
    paddingVertical: hp(7),
    paddingHorizontal: wp(16),
  },
    popularCourseCardV2: {
   backgroundColor: colors.user.card,
   borderWidth: 1,
   borderColor: colors.user.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: hp(14),
  },
  popularCourseBannerWrap: {
    position: 'relative',
  },
  popularCourseBanner: {
    width: '100%',
    height: hp(120),
  },
  levelBadgeOverlay: {
    position: 'absolute',
    top: hp(8),
    left: wp(8),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
  },
  popularCourseCardInfoV2: {
    padding: wp(12),
  },
  courseInstructorText: {
    fontSize: fp(11.5),
    color: colors.user.subHeading,
    marginTop: hp(3),
  },
  courseMetaRowV2: {
    flexDirection: 'row',
    gap: wp(14),
    marginTop: hp(8),
    marginBottom: hp(8),
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  featuredMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(12),
    marginBottom: hp(14),
  },
});