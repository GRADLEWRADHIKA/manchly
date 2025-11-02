import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  Users,
  Clock,
  Play,
  Edit3,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { deleteCourse, fetchCourses } from '../../../../store/CourseSlice';
import DynamicModal from '../../../../components/CommonModal';

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
      .catch(error => console.log('----error---', error))
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
      .catch(error => {
        console.log('----error---', error);
        setDeleteLoader(false);
      });
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const Card = ({ item }: { item: any }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.courseCard,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => navigation.navigate('CourseVideoList', { item })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.thumbnailContainer}>
              <Image
                source={{
                  uri:
                    item.thumbnail ||
                    'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
                }}
                style={styles.thumbnail}
              />
            </View>

            <View style={styles.courseInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {item?.title}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </View>
              <Text style={styles.courseCategory}>{item?.category}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description ||
                  'No description available for this course. Add a compelling description to attract more students.'}
              </Text>
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Users size={14} color={colors.primary} />
                <Text style={styles.metaText}>
                  {item?.language || 'English'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.primary} />
                <Text style={styles.metaText}>{item?.level || 'Beginner'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.durationText}>
                  {item.duration || '8h 30m'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() =>
                navigation.navigate('CreateCourse', {
                  data: item,
                  isUpdated: true,
                })
              }
            >
              <Edit3 size={16} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.actionSeparator} />

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => {
                setShowModal(true);
                setCourseId(item?.id);
              }}
            >
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
      <View style={styles.heroSection}>
        <Text style={styles.heroHeading}>Welcome back, Creator! 👋</Text>
        <Text style={styles.heroSub}>
          Manage your courses and track performance
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your courses...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={({ item }) => <Card item={item} />}
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
  container: { flex: 1, backgroundColor: colors.white },
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
  courseCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  publishedBadge: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  courseInfo: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  courseCategory: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: {
    marginLeft: 6,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  listContent: { paddingVertical: 16, paddingBottom: 100 },
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
});
