import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  FlatList,
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
import { Bell, BookOpen, Search, UserCircle, Instagram, X, Plus } from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextInput from '../../../../../components/CustomInput';

const LIMIT = 10;

const CreatorView: React.FC<{embedded?: boolean}> = ({embedded = false}) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const focus = useIsFocused();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<any>(null);

  const [showModal, setShowModal] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [deleteLoader, setDeleteLoader] = useState(false);

  // Fetch courses from API
  const fetchData = useCallback((pageNum: number, search: string, refresh = false) => {
    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const payload: any = { page: pageNum, limit: LIMIT, my_courses: true };
    if (search.trim()) {
      payload.search = search.trim();
    }

    dispatch(fetchCourses(payload))
      .unwrap()
      .then(response => {
        const courses = response?.data?.data?.courses || [];
        const totalCount = response?.data?.data?.pagination?.total || courses.length;

        if (refresh) {
          setData(courses);
        } else {
          setData(prev => [...prev, ...courses]);
        }

        setTotal(totalCount);
        setHasMore(courses.length >= LIMIT);
        setPage(pageNum);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [dispatch]);

  // Initial load + refetch on focus
  useEffect(() => {
    if (focus) {
      fetchData(1, searchQuery, true);
    }
  }, [focus]);

  // Debounced search - hit API after 500ms of no typing
  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      fetchData(1, text, true);
    }, 500);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchData(1, '', true);
  };

  // Load more on scroll end
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchData(page + 1, searchQuery, false);
    }
  };

  const handleDelete = () => {
    setDeleteLoader(true);
    dispatch(deleteCourse(courseId))
      .unwrap()
      .then(() => {
        setDeleteLoader(false);
        setShowModal(false);
        fetchData(1, searchQuery, true);
      })
      .catch(() => setDeleteLoader(false));
  };

  const renderItem = ({ item }: { item: any }) => (
    <CourseCard
      item={item}
      onEdit={() =>
        navigation.navigate('CreateCourse', { data: item, isUpdated: true })
      }
      onDelete={() => {
        setShowModal(true);
        setCourseId(item?.id);
      }}
      onView={() => navigation.navigate('CourseVideoList', { item })}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <BookOpen size={wp(30)} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No courses found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? 'Try a different search term'
            : 'Create your first course to get started'}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={wp(18)} color={colors.textSecondary} />
        <CustomTextInput
          inputContainerStyle={styles.searchInput}
          inputStyle={{ fontSize: fp(14), color: colors.textPrimary }}
          placeholderTextColor={colors.textMuted}
          placeholder="Search courses..."
          onChange={handleSearch as any}
          value={searchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={wp(18)} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>My Courses</Text>
        <Text style={styles.courseCount}>{total} courses</Text>
      </View>

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {!embedded && (
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user?.profile_image ? (
                <Image source={{ uri: user?.profile_image }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserCircle size={wp(28)} color={colors.textPrimary} />
                </View>
              )}
              <View>
                <Text style={styles.headerSub}>My Courses</Text>
                <Text style={styles.headerTitle}>
                  {total} course{total !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
              >
                <Instagram size={wp(20)} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => navigation.navigate('CreatorNotification')}
              >
                <Bell size={wp(20)} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={loading ? [] : data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.fabContainer}>
        <FAB
          icon={({ size, color }) => <Plus size={size} color={color} />}
          style={styles.fab}
          onPress={() => navigation.navigate('CreateCourse')}
          color={colors.bg}
        />
      </View>

      <DynamicModal
        visible={showModal}
        heading="Delete Course"
        message="Are you sure you want to delete this course?"
        onCancel={() => setShowModal(false)}
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
    backgroundColor: colors.bg,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: hp(20),
  },

  // Header
  headerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  headerSub: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(14),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(14),
    paddingHorizontal: wp(12),
    backgroundColor: colors.inputBg,
  },
  searchInput: {
    height: hp(44),
    width: '85%',
    borderRadius: wp(14),
    backgroundColor: colors.inputBg,
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
    color: colors.textPrimary,
  },
  courseCount: {
    fontSize: fp(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Loaders
  loaderContainer: {
    height: hp(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(16),
    gap: wp(8),
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fp(13),
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(14),
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(19),
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    right: wp(16),
    bottom: hp(16),
  },
  fab: {
    backgroundColor: colors.gold,
    borderRadius: wp(50),
  },
});