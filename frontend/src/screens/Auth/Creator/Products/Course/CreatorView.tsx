import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { deleteCourse, fetchCourses } from '../../../../../store/CourseSlice';
import DynamicModal from '../../../../../components/CommonModal';
import CourseCard from './CourseCard';
import { Bell, BookOpen, Search, UserCircle, Instagram } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../../../../components/CustomInput';

const CreatorView: React.FC<{embedded?: boolean}> = ({embedded = false}) => {
  const navigation = useNavigation<any>();
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

  useEffect(() => {
    getTheCourse(1, true);
  }, [focus]);

  const getTheCourse = (pageNum: number, refresh = false) => {
    if (loading || loadingMore) return;

    refresh ? setLoading(true) : setLoadingMore(true);

    const payload = { page: pageNum, limit: 10, my_courses: true };

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
        <ActivityIndicator size="small" color={colors.cBg} />
        <Text style={styles.loadingText}>Loading more courses...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <BookOpen size={wp(30)} color={'#94A3B8'} />
      </View>
      <Text style={styles.emptyTitle}>No courses found</Text>
      <Text style={styles.emptySubtitle}>
        {searchCourse
          ? 'Try a different search term'
          : 'Create your first course to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {!embedded && (
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user?.profile_image ? (
                <Image
                  source={{ uri: user?.profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserCircle size={wp(28)} color={colors.white} />
                </View>
              )}
              <View>
                <Text style={styles.headerSub}>My Courses</Text>
                <Text style={styles.headerTitle}>
                  {data.length} course{data.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}
            >
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() =>
                  Linking.openURL('https://www.instagram.com/manchly_app')
                }
              >
                <Instagram size={wp(20)} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => navigation.navigate('CreatorNotification')}
              >
                <Bell size={wp(20)} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.searchContainer}>
          <Search size={wp(18)} color={'#64748B'} />
          <CustomTextInput
            inputContainerStyle={styles.searchInput}
            inputStyle={{ fontSize: fp(14), color: '#1A1A2E' }}
            placeholderTextColor={'#94A3B8'}
            placeholder="Search courses..."
            onChange={setSearchCourse as any}
            value={searchCourse}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Courses</Text>
          <Text style={styles.courseCount}>
            {filteredCourses.length} courses
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.cBg} />
            <Text style={styles.loadingText}>Loading your courses...</Text>
          </View>
        ) : (
          <View style={styles.verticalListContainer}>
            {filteredCourses.length === 0
              ? renderEmptyState()
              : filteredCourses.map(item => (
                  <CourseCard
                    key={item.id}
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
                ))}
            {renderFooter()}
          </View>
        )}
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(20),
  },

  // Header
  headerWrapper: {
    backgroundColor: colors.cSurface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  headerSub: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.cText,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: wp(14),
    paddingHorizontal: wp(12),
    backgroundColor: '#F8FAFC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  searchInput: {
    height: hp(44),
    width: '92%',
    borderRadius: wp(14),
  },

  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(10),
    paddingHorizontal: wp(20),
    marginTop: hp(4),
  },
  listTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#1A1A2E',
  },
  courseCount: {
    fontSize: fp(13),
    color: '#64748B',
    fontWeight: '500',
  },

  // Course list
  verticalListContainer: {
    paddingHorizontal: wp(12),
    paddingTop: hp(4),
  },
  loaderContainer: {
    height: hp(200),
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(12),
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
    gap: wp(12),
  },
  loadingText: {
    color: '#64748B',
    fontSize: fp(14),
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(60),
    paddingHorizontal: wp(40),
  },
  emptyIcon: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(14),
  },
  emptyTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: hp(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fp(19),
  },

  // Stats
  statsSection: {
    padding: wp(16),
  },
  statsTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: hp(10),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: hp(10),
  },

  // Withdraw
  withdrawCard: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  withdrawLabel: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: fp(12),
  },
  withdrawAmount: {
    color: colors.cAccentLight,
    marginTop: hp(2),
    fontSize: fp(18),
    fontWeight: '900',
  },
  withdrawBtn: {
    backgroundColor: colors.cAccent,
    paddingVertical: hp(10),
    paddingHorizontal: wp(18),
    borderRadius: wp(10),
  },
  withdrawBtnText: {
    fontWeight: '700',
    color: colors.white,
    fontSize: fp(13),
  },
});
