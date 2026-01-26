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
  StatusBar as RNStatusBar,
} from 'react-native';
import colors from '../../../../../utils/colors';
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
import { getAllWebinar } from '../../../../../store/WebinarSlice';
import WebinarCard from '../Webinar/WebinarCard';
import LinearGradient from 'react-native-linear-gradient';

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
  const [active, setActive] = useState('course');
  const [searchCourse, setSearchCourse] = useState('');
  const [webinarData, setWebinarData] = useState([]);
  const [refreshWebinar, setRefreshWebinar] = useState(false);

  const quickStats = [
    {
      label: 'Active Courses',
      value: '****',
      icon: <BookOpen size={24} color={colors.primary} />,
    },
    {
      label: 'Students',
      value: '****',
      icon: <Users size={24} color={colors.secondary} />,
    },
    {
      label: 'Completion Rate',
      value: '****',
      icon: <Award size={24} color={colors.accent} />,
    },
    {
      label: 'Revenue',
      value: '****',
      icon: <TrendingUp size={24} color={colors.golden} />,
    },
  ];

  useEffect(() => {
    getTheCourse(1, true);
  }, [focus]);

  useEffect(() => {
    funGetAllWebinar(1, 10);
  }, [focus, refreshWebinar]);

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

  // search webinar-----
  const filteredWebinar = useMemo(() => {
    if (!searchCourse.trim()) return webinarData;

    return webinarData.filter(item =>
      item?.title?.toLowerCase().includes(searchCourse.toLowerCase()),
    );
  }, [searchCourse, webinarData]);

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

  // get all webinar ------------
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
      })
      .finally(() => { });
  };

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" />
      <View
        style={[
          styles.mainHeader,
          { paddingTop: insets.top + 10, backgroundColor: colors.primary },
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
                    ? user.name.charAt(0).toUpperCase() +
                    user.name.slice(1)
                    : 'User'}{' '}
                  👋
                </Text>
                <Text style={styles.firstPara}>Welcome back</Text>
              </View>
            </View>

            <BellDot width={22} height={22} color={colors.primary} />
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
              <Search width={20} height={20} color={colors.textSecondary} />
              <CustomTextInput
                inputContainerStyle={[styles.nameFields]}
                inputStyle={{ fontSize: 16, color: colors.black }}
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
              console.log('---filter---');
            }}
          >
            <SlidersHorizontal size={30} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.listHeader,
            { flexDirection: 'row', gap: 10, marginLeft: 20 },
          ]}
        >
          {['course', 'webinar'].map(item => {
            const isActive = active === item;

            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => setActive(item)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: isActive ? colors.primary : colors.white,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.borderColor,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.15 : 0,
                  shadowRadius: 4,
                  elevation: isActive ? 5 : 0,
                  transform: [{ scale: isActive ? 1.03 : 1 }],
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: isActive ? colors.white : colors.text,
                  }}
                >
                  {item === 'course' ? 'Courses' : 'Webinar'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {active === 'course' ? (
          <>
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
          </>
        ) : (
          <View style={{ marginTop: 10 }}>
            <FlatList
              data={filteredWebinar}
              horizontal
              contentContainerStyle={{ paddingRight: 100 }}
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <WebinarCard
                  data={item}
                  setRefreshWebinar={setRefreshWebinar}
                />
              )}
            />
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats?.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIcon}>{stat?.icon}</View>
                <Text style={styles.statValue}>{stat?.value}</Text>
                <Text style={styles.statLabel}>{stat?.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.withdrawCard}>
          <View style={styles.withdrawLeft}>
            <View style={{ marginLeft: 12 }}>
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
    paddingBottom: 20,
  },
  heroSection: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  horizontalListContainer: {
    minHeight: 300,
  },
  horizontalListContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  loaderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    width: 200,
  },
  loadingText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    width: screenWidth - 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
  },
  mainHead: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
  },
  firstPara: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '400'
  },
  secPara: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  nameFields: {
    height: 44,
    width: '95%',
    borderRadius: 20
  },
  searchHeader: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderColor: colors.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 3,
    backgroundColor: colors.white,
    elevation: 3,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  courseCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statsSection: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  withdrawCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
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
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
  },
  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.white,
  },
  headerBg: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
