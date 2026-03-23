import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { deleteCourse, fetchCourses } from '../../../../../store/CourseSlice';
import DynamicModal from '../../../../../components/CommonModal';
import CourseCard from './CourseCard';
import {
  Award,
  BellDot,
  BookOpen,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../../../../components/CustomInput';
import UserIcon from '../../Home/component/UserIcon';
import LinearGradient from 'react-native-linear-gradient';
import DashboardCard from '../../Home/component/DashboardCard';

const { width: screenWidth } = Dimensions.get('window');

const CreatorView: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const focus = useIsFocused();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [deleteLoader, setDeleteLoader] = useState(false);
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const [searchCourse, setSearchCourse] = useState('');

  const quickStats = [
    {
      label: 'Active Courses',
      value: '0',
      icon: <BookOpen size={wp(24)} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '0',
      icon: <Users size={wp(24)} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '0',
      icon: <Award size={wp(24)} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '0',
      icon: <TrendingUp size={wp(24)} color={colors.golden} />,
    },
  ];

  useEffect(() => {
    getTheCourse(1, true);
  }, [focus]);

  const getTheCourse = (pageNum: number, refresh = false) => {
    if (loading || loadingMore) return;

    refresh ? setLoading(true) : setLoadingMore(true);

    const payload = { page: pageNum, limit: 10 };

    dispatch(fetchCourses(payload))
      .unwrap()
      .then(response => {
        const newData = response?.data?.data?.courses || [];
        refresh ? setData(newData) : setData(prev => [...prev, ...newData]);
        setHasMore(newData.length >= 10);
        setPage(pageNum);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const handleDelete = () => {
    setDeleteLoader(true);
    dispatch(deleteCourse(courseId))
      .unwrap()
      .then(() => {
        setDeleteLoader(false);
        setShowModal(false);
        getTheCourse(1, true);
      })
      .catch(() => setDeleteLoader(false));
  };

  const handleCancel = () => setShowModal(false);

  // search course-----
  const filteredCourses = useMemo(() => {
    if (!searchCourse.trim()) return data;

    return data.filter(item =>
      item?.title?.toLowerCase().includes(searchCourse.toLowerCase()),
    );
  }, [searchCourse, data]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading more courses...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No courses found</Text>
      <Text style={styles.emptySubtitle}>
        Try searching with a different name
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mainHeader,
          { paddingTop: insets.top + hp(10), backgroundColor: colors.primary },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#c2c2c2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBg}
        >
          <View style={styles.headerContent}>
            <View style={styles.mainHead}>
              {user?.profile_image ? (
                <Image
                  source={{ uri: user?.profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <UserIcon />
              )}

              <View>
                <Text style={styles.secPara}>
                  Hi,{' '}
                  {user?.name
                    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                    : 'User'}{' '}
                  👋
                </Text>
                <Text style={styles.firstPara}>Welcome back</Text>
              </View>
            </View>

            <BellDot width={wp(22)} height={hp(22)} color={colors.primary} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: '90%' }}>
            <View style={styles.searchHeader}>
              <Search width={wp(20)} height={hp(20)} color={colors.textSecondary} />
              <CustomTextInput
                inputContainerStyle={[styles.nameFields]}
                inputStyle={{ fontSize: fp(16), color: colors.black }}
                placeholderTextColor={colors.borderColor}
                placeholder="Search course by name"
                onChange={text => setSearchCourse(text)}
                value={searchCourse}
              />
            </View>
          </View>
          <TouchableOpacity
            style={{ width: '10%' }}
            onPress={() => {
            }}
          >
            <SlidersHorizontal size={wp(30)} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Courses</Text>
          <Text style={styles.courseCount}>{filteredCourses.length} courses</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your courses...</Text>
          </View>
        ) : (
          <View style={styles.horizontalListContainer}>
            <FlatList
              data={filteredCourses}
              nestedScrollEnabled
              renderItem={({ item, index }) => (
                <CourseCard
                  item={item}
                  onEdit={() =>
                    navigation.navigate('CreateCourse', {
                      data: item,
                      isUpdated: true,
                    })
                  }
                  onDelete={() => {
                    setShowModal(true);
                    setCourseId(item?.id);
                  }}
                  onView={() =>
                    navigation.navigate('CourseVideoList', { item })
                  }
                />
              )}
              horizontal
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              ListEmptyComponent={renderEmptyState}
              onEndReached={() => {
                if (hasMore && !loadingMore) getTheCourse(page + 1);
              }}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              snapToInterval={screenWidth - 40}
              snapToAlignment="center"
              decelerationRate="fast"
            />
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <DashboardCard
                key={index}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </View>
        </View>

        <View style={styles.withdrawCard}>
          <View style={styles.withdrawLeft}>
            <View style={{ marginLeft: wp(12) }}>
              <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
              <Text style={styles.withdrawAmount}>₹ *****</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8}>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DynamicModal
        visible={showModal}
        heading="Delete Course"
        message="Are you sure you want to delete this course?"
        onCancel={handleCancel}
        onDelete={handleDelete}
        loading={deleteLoader}
      />
    </View>
  );
};

export default CreatorView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(20),
  },
  heroSection: {
    backgroundColor: colors.white,
    padding: wp(20),
    borderBottomLeftRadius: wp(24),
    borderBottomRightRadius: wp(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  horizontalListContainer: {
    minHeight: hp(300),
  },
  horizontalListContent: {
    paddingVertical: hp(16),
    paddingHorizontal: wp(8),
  },
  loaderContainer: {
    height: hp(200),
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(16),
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
    gap: wp(12),
    width: wp(200),
  },
  loadingText: { color: colors.textSecondary, fontSize: fp(14), fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(60),
    paddingHorizontal: wp(40),
    width: screenWidth - 32,
  },
  emptyTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
  },
  mainHead: {
    flexDirection: 'row',
    gap: wp(10),
    alignItems: 'center',
  },
  avatar: {
    width: wp(54),
    height: hp(54),
    borderRadius: wp(27),
    backgroundColor: colors.primary,
  },
  firstPara: {
    color: colors.primary,
    fontSize: fp(14),
    fontWeight: '400',
  },
  secPara: {
    color: colors.primary,
    fontSize: fp(16),
    fontWeight: '600',
  },
  nameFields: {
    height: hp(44),
    width: '95%',
    borderRadius: wp(20),
  },
  searchHeader: {
    marginHorizontal: wp(16),
    marginVertical: hp(10),
    borderColor: colors.borderColor,
    borderWidth: wp(1),
    borderRadius: wp(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(15),
    gap: wp(3),
    backgroundColor: colors.white,
    elevation: 3,
  },
  listTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.text,
  },
  courseCount: {
    fontSize: fp(14),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statsSection: {
    padding: wp(16),
  },
  statsTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(10),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: wp(20),
    padding: wp(16),
    alignItems: 'center',
    marginBottom: hp(12),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon: {
    marginBottom: hp(8),
  },
  statValue: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: fp(12),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  withdrawCard: {
    backgroundColor: colors.white,
    borderRadius: wp(20),
    padding: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(16),
    elevation: 5,
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  withdrawLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  withdrawAmount: {
    color: colors.primary,
    marginTop: hp(2),
    fontSize: fp(18),
    fontWeight: '900',
  },
  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingVertical: hp(8),
    paddingHorizontal: wp(14),
    borderRadius: wp(10),
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.white,
  },
  headerBg: {
    width: '100%',
    paddingTop: hp(10),
    paddingBottom: hp(16),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(20),
  },
});
