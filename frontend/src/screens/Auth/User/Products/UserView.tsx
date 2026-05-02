import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable,
  Linking,
} from 'react-native';
import {
  Search,
  BookOpen,
  Presentation,
  TrendingUp,
  X,
  Instagram,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import CustomTextInput from '../../../../components/CustomInput';
import CourseCard from './component/CourseCard';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import EnrolledWebinarCard from './component/EnrolledWebinarCard';
import { wp, hp, fp } from '../../../../utils/responsive';

const TAB_OPTIONS = [
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'webinar', label: 'Webinars', icon: Presentation },
];

const UserView: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector((state: any) => state.userReducer);
  const { list: allCourses } = useSelector(
    (state: any) => state.coursesReducer,
  );
  const { list: enrolledCourses } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );
  const [active, setActive] = useState('courses');
  const [webinarData, setWebinarData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = () => {
    dispatch(fetchCourses({}));
    dispatch(getEnrolledCourses({}));
    funGetAllWebinar(1, 10);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const enrolledCourseIds = (enrolledCourses.enrollments || []).map(
    (e: any) => e.course_id,
  );

  const browseCourses = allCourses?.data?.courses || [];

  const filteredCourses = browseCourses.filter((course: any) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetailsScreen', { courseId });
  };

  const funGetAllWebinar = (pageNum: number, dataLimit: number) => {
    const payload = {
      page: pageNum,
      limit: dataLimit,
      upcoming: true,
      title: '',
    };
    dispatch(getAllWebinar(payload))
      .unwrap()
      .then((response: any) => {
        setWebinarData(response?.data?.data?.webinars);
      });
  };

  const displayName = user?.name
    ? user.name.split(' ')[0].charAt(0).toUpperCase() +
      user.name.split(' ')[0].slice(1)
    : 'there';

  const enrolledCount = enrolledCourseIds.length;

  const renderListHeader = () => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeading}>
        {active === 'courses' ? 'Browse Courses' : 'Upcoming Webinars'}
      </Text>
      <Text style={styles.sectionCount}>
        {active === 'courses'
          ? `${filteredCourses.length} courses`
          : `${webinarData?.length || 0} webinars`}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      {active === 'courses' ? (
        <BookOpen size={wp(40)} color={colors.muted} />
      ) : (
        <Presentation size={wp(40)} color={colors.muted} />
      )}
      <Text style={styles.emptyTitle}>
        {active === 'courses' ? 'No courses found' : 'No webinars available'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try a different search term'
          : active === 'courses'
          ? 'New courses will appear here'
          : 'Upcoming webinars will be listed here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View
        style={[styles.hero, { paddingTop: insets.top + hp(16), backgroundColor: colors.secPrimary }]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>Hey {displayName} 👋</Text>
            <Text style={styles.heroHeading}>
              {active === 'courses' ? 'Discover & Learn' : 'Join Live Webinars'}
            </Text>
            <Text style={styles.heroSubtext}>
              {active === 'courses'
                ? 'Explore courses from top creators'
                : 'Attend live sessions with experts'}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.instaBtn,
              pressed && styles.instaBtnPressed,
            ]}
            onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
            accessibilityLabel="Instagram">
            <Instagram size={wp(18)} color={colors.white} strokeWidth={2} />
          </Pressable>
        </View>

        {enrolledCount > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <TrendingUp size={wp(14)} color="#60A5FA" />
              <Text style={styles.statText}>{enrolledCount} Enrolled</Text>
            </View>
            <View style={styles.statItem}>
              <BookOpen size={wp(14)} color="#34D399" />
              <Text style={styles.statText}>
                {browseCourses.length} Available
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={wp(18)} color={colors.textSecondary} />
        <CustomTextInput
          inputContainerStyle={styles.searchInput}
          placeholder={
            active === 'courses' ? 'Search courses...' : 'Search webinars...'
          }
          onChange={setSearchQuery}
          value={searchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={wp(18)} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TAB_OPTIONS.map(tab => {
          const isActive = active === tab.key;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActive(tab.key)}
              style={[styles.tabBtn, isActive && styles.activeTabBtn]}
              activeOpacity={0.7}
            >
              <Icon
                size={wp(16)}
                color={isActive ? colors.white : colors.textSecondary}
              />
              <Text
                style={[styles.tabText, isActive && styles.activeTabText]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable List */}
      {active === 'courses' ? (
        <FlatList
          data={filteredCourses}
          keyExtractor={i => i.id || i._id}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => {
            const isEnrolled = enrolledCourseIds.includes(
              item.id || item._id,
            );
            return (
              <View style={styles.cardWrap}>
                <CourseCard
                  item={item}
                  isEnrolled={isEnrolled}
                  userType={user?.user_type}
                  handleCoursePress={handleCoursePress}
                />
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <FlatList
          data={webinarData}
          keyExtractor={(item: any) => item?.id}
          ListHeaderComponent={renderListHeader}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <EnrolledWebinarCard item={item} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default UserView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingBottom: hp(100),
  },

  // Hero
  hero: {
    paddingTop: hp(20),
    paddingBottom: hp(20),
    paddingHorizontal: wp(20),
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroContent: {
    flex: 1,
    marginBottom: hp(8),
  },
  instaBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: hp(4),
  },
  instaBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ scale: 0.93 }],
  },
  heroGreeting: {
    fontSize: fp(14),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: hp(4),
  },
  heroHeading: {
    fontSize: fp(26),
    fontWeight: '900',
    color: colors.white,
    marginBottom: hp(4),
  },
  heroSubtext: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginTop: hp(12),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(10),
  },
  statText: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    marginTop: hp(16),
    marginHorizontal: wp(16),
    paddingHorizontal: wp(14),
    height: hp(48),
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    gap: wp(8),
  },
  searchInput: {
    flex: 1,
    height: hp(48),
    borderWidth: 0,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(16),
    gap: wp(10),
    marginTop: hp(16),
    marginBottom: hp(4),
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    paddingVertical: hp(11),
    borderRadius: wp(12),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#eaecef',
  },
  activeTabBtn: {
    backgroundColor: colors.secPrimary,
    borderColor: '#1A1A2E',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fp(13),
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.white,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp(20),
    marginTop: hp(18),
    marginBottom: hp(12),
  },
  sectionHeading: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Cards
  cardWrap: {
    paddingHorizontal: wp(16),
  },

  // Empty State
  emptyState: {
    paddingVertical: hp(60),
    alignItems: 'center',
    gap: hp(8),
  },
  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    marginTop: hp(8),
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fp(13),
    textAlign: 'center',
    paddingHorizontal: wp(40),
  },
});
