import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import {
  Search,
  BookOpen,
  PlayCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import CourseCard from './components/CourseCard';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import WebinarCard from './components/WebinarCard';
import { wp, hp, fp } from '../../../../utils/responsive';

const { width } = Dimensions.get('window');

/* ──── Section Header ──── */
const SectionHeader = ({ title, onSeeAll }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <Pressable
        style={styles.seeAllBtn}
        onPress={onSeeAll}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.seeAllText}>See All</Text>
        <ChevronRight size={wp(14)} color={colors.secPrimary} />
      </Pressable>
    )}
  </View>
);

/* ──── Empty State ──── */
const EmptyCard = ({ icon: Icon, title, btnText, onPress }: any) => (
  <View style={styles.emptyCard}>
    <View style={styles.emptyIconWrap}>
      <Icon size={wp(28)} color={colors.secPrimary} strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.emptyButton,
        pressed && styles.emptyButtonPressed,
      ]}
    >
      <Text style={styles.emptyButtonText}>{btnText}</Text>
    </Pressable>
  </View>
);

/* ──── Carousel Dot Indicator ──── */
const DotIndicator = ({ count, activeIndex }: any) => (
  <View style={styles.dotRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[styles.dot, i === activeIndex && styles.dotActive]}
      />
    ))}
  </View>
);

const UserHome = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const [webinarData, setWebinarData] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const focus = useIsFocused();

  useEffect(() => {
    dispatch(getEnrolledCourses({}));
  }, [focus]);

  useEffect(() => {
    funGetAllWebinar(1, 5);
  }, [focus]);

  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );

  const carouselData = [
    {
      title: 'Learn Anytime, Anywhere',
      subtitle: 'Access courses on any device',
      image:
        'https://img.freepik.com/free-vector/online-courses-tutorials_23-2148527797.jpg',
    },
    {
      title: 'Upgrade Your Skills Today',
      subtitle: 'Stay ahead of the curve',
      image:
        'https://img.freepik.com/free-vector/education-concept-illustration_114360-6266.jpg',
    },
    {
      title: 'Grow with the Best Instructors',
      subtitle: 'Expert-led learning paths',
      image:
        'https://img.freepik.com/free-vector/elearning-concept-illustration_114360-6217.jpg',
    },
  ];

  const renderCourseItem = useCallback(
    ({ item }: any) => (
      <View style={styles.courseItem}>
        <CourseCard item={item} />
      </View>
    ),
    [],
  );

  const renderWebinarItem = useCallback(
    ({ item }: any) => (
      <View style={styles.webinarItem}>
        <WebinarCard data={item} />
      </View>
    ),
    [],
  );

  const funGetAllWebinar = (pageNum: number, dataLimit: number) => {
    const payload = {
      page: pageNum,
      limit: dataLimit,
      upcoming: true,
      title: '',
    };
    dispatch(getAllWebinar(payload))
      .unwrap()
      .then(response => {
        setWebinarData(response?.data?.data?.webinars);
      });
  };

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'User';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <View style={styles.root}>
      {/* ──── Header ──── */}
      <View style={[styles.mainHeader, { paddingTop: insets.top + hp(4) }]}>
        <Pressable
          style={styles.headerLeft}
          onPress={() => navigation.navigate('UserSetting')}
        >
          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.greetingLabel}>Welcome back</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.searchBtn,
            pressed && styles.searchBtnPressed,
          ]}
          onPress={() => navigation.navigate('UserCourseSearch')}
          accessibilityLabel="Search courses"
        >
          <Search size={wp(20)} color={colors.white} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Curved bottom edge */}
      <View style={styles.headerCurve} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ──── Carousel ──── */}
        <View style={styles.carouselWrap}>
          <Carousel
            loop
            width={width - wp(32)}
            height={hp(170)}
            autoPlay
            data={carouselData}
            scrollAnimationDuration={1200}
            autoPlayInterval={4000}
            onSnapToItem={setCarouselIndex}
            renderItem={({ item }) => (
              <View style={styles.carouselCard}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselText}>{item.title}</Text>
                  <Text style={styles.carouselSubtext}>{item.subtitle}</Text>
                </View>
              </View>
            )}
          />
          <DotIndicator count={carouselData.length} activeIndex={carouselIndex} />
        </View>

        {/* ──── Courses ──── */}
        <SectionHeader
          title="Your Courses"
          onSeeAll={
            enrolledCourses?.enrollments?.length > 0
              ? () => navigation.navigate('PurchasesScreen')
              : undefined
          }
        />

        {enrolledLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.secPrimary}
            style={styles.loader}
          />
        ) : enrolledCourses?.enrollments?.length === 0 ? (
          <EmptyCard
            icon={BookOpen}
            title="No Courses Enrolled Yet"
            btnText="Browse Courses"
            onPress={() => navigation.navigate('UserCourseSearch')}
          />
        ) : (
          <FlatList
            horizontal
            data={enrolledCourses?.enrollments}
            renderItem={renderCourseItem}
            keyExtractor={(item: any) => item.id?.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContainer}
          />
        )}

        {/* ──── Webinars ──── */}
        <SectionHeader title="Upcoming Webinars" />

        {webinarData.length === 0 ? (
          <EmptyCard
            icon={PlayCircle}
            title="No Webinars Available"
            btnText="Explore Webinars"
          />
        ) : (
          <FlatList
            horizontal
            data={webinarData}
            renderItem={renderWebinarItem}
            keyExtractor={(item: any) => item.id?.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContainer}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default memo(UserHome);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(100),
  },

  /* ──── Header ──── */
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(10),
    backgroundColor: colors.secPrimary,
    zIndex: 10,
  },
  headerCurve: {
    backgroundColor: colors.secPrimary,
    height: hp(10),
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    flex: 1,
  },
  avatar: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(13),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarFallback: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(13),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: fp(15),
    fontWeight: '700',
  },
  greetingLabel: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
  searchBtn: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ scale: 0.93 }],
  },

  /* ──── Carousel ──── */
  carouselWrap: {
    alignItems: 'center',
    marginTop: hp(16),
  },
  carouselCard: {
    borderRadius: wp(16),
    overflow: 'hidden',
    marginHorizontal: wp(4),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  carouselImage: {
    width: '100%',
    height: hp(170),
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: wp(16),
    borderRadius: wp(16),
  },
  carouselText: {
    color: colors.white,
    fontSize: fp(18),
    fontWeight: '700',
    lineHeight: fp(24),
  },
  carouselSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fp(12.5),
    fontWeight: '500',
    marginTop: hp(2),
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    marginTop: hp(12),
  },
  dot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    width: wp(20),
    backgroundColor: colors.secPrimary,
    borderRadius: wp(4),
  },

  /* ──── Section Header ──── */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(22),
    marginBottom: hp(12),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  seeAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.secPrimary,
  },

  /* ──── Lists ──── */
  flatListContainer: {
    paddingHorizontal: wp(16),
  },
  courseItem: {
    width: width * 0.44,
    marginRight: wp(12),
  },
  webinarItem: {
    width: width * 0.72,
    marginRight: wp(12),
  },
  loader: {
    marginVertical: hp(20),
  },

  /* ──── Empty Card ──── */
  emptyCard: {
    marginHorizontal: wp(16),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    borderRadius: wp(16),
    backgroundColor: colors.white,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
  },
  emptyIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(18),
    backgroundColor: '#1E3A5F0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: '#1E3A5F12',
  },
  emptyTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: hp(14),
  },
  emptyButton: {
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(22),
    paddingVertical: hp(10),
    borderRadius: wp(12),
  },
  emptyButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fp(13),
  },
});
