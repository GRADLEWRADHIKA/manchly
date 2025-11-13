import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  StatusBar as RNStatusBar,
  Image,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { deleteCourse, fetchCourses } from '../../../../../store/CourseSlice';
import DynamicModal from '../../../../../components/CommonModal';
import AppHeader from '../../../../../components/AppHeader';
import CourseCard from './CourseCard';
import { BellDot } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreatorView: React.FC = () => {
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
  const { token } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);

  useEffect(() => {
    getTheCourse(1, true);
  }, [focus]);

  // calling the get the all course api -------
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
      .catch(error => console.log('----error---', error))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  // calling the delete api  ----
  const handleDelete = () => {
    setDeleteLoader(true);
    dispatch(deleteCourse(courseId))
      .unwrap()
      .then(() => {
        setDeleteLoader(false);
        setShowModal(false);
        getTheCourse(1, true);
      })
      .catch(error => {
        console.log('----error---', error);
        setDeleteLoader(false);
      });
  };

  const handleCancel = () => setShowModal(false);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading more courses...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mainHeader,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <View style={styles.mainHead}>
          <View>
            <Image
              source={{ uri: user?.profile_image }}
              style={styles.avatar}
            />
          </View>
          <View>
            <Text style={styles.firstPara}>Hello,</Text>
            <Text style={styles.secPara}>{user?.name}</Text>
          </View>
        </View>
        <View>
          <BellDot width={22} height={22} color={colors.white} />
        </View>
      </View>
      {/* <RNStatusBar barStyle="light-content" />
      <AppHeader title="Manchly" /> */}

      {/* <View style={styles.heroSection}>
        <Text style={styles.heroHeading}>Welcome back, Creator! 👋</Text>
        <Text style={styles.heroSub}>
          Manage your courses and track performance
        </Text>
      </View> */}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your courses...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={({ item }) => (
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
              onView={() => navigation.navigate('CourseVideoList', { item })}
            />
          )}
          horizontal
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No courses yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first course to start teaching
              </Text>
            </View>
          }
          onEndReached={() => {
            if (hasMore && !loadingMore) getTheCourse(page + 1);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}

      <DynamicModal
        visible={showModal}
        heading="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone and all course data will be lost."
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
  heroHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
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
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  mainHead: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.lightGrey,
    marginRight: 12,
  },
  firstPara: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '400',
  },
  secPara: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
