import React, { memo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../../../store/CourseSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { getEnrolledCourses } from '../../../../../store/EnrollmentSlice';

const LatestCourseItem = ({ item, onPress }: any) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {item?.thumbnail ? (
        <Image source={{ uri: item?.thumbnail }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <BookOpen size={wp(22)} color={colors.uSubHeading} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.info}>
        {(item?.category || item?.duration) && (
          <View style={styles.tagsRow}>
            {item?.category && (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.category}</Text>
              </View>
            )}
            {item?.duration && (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.duration} HOURS</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {item?.title}
        </Text>
      </View>
    </Pressable>
  );
};

const LatestCourses = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { list: allCourses } = useSelector(
    (state: any) => state.coursesReducer,
  );
  const browseCourses = allCourses?.data?.courses || [];
  const focus = useIsFocused();

  useEffect(() => {
    dispatch(fetchCourses({}));
    dispatch(getEnrolledCourses({}));
  }, [focus]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Latest Courses</Text>
          <Text style={styles.sectionSubtitle}>
            Freshly added content for your curriculum
          </Text>
        </View>
        <Pressable style={styles.seeAllBtn} hitSlop={8}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={wp(14)} color="rgba(255,255,255,0.7)" strokeWidth={2} />
        </Pressable>
      </View>
      <FlatList
        data={browseCourses}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item?.id || item?._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <LatestCourseItem
            item={item}
            onPress={() =>
              navigation.navigate('CourseDetailsScreen', {
                courseId: item?.id,
                videoList: item?.videos,
              })
            }
          />
        )}
      />
    </View>
  );
};

export default memo(LatestCourses);

const styles = StyleSheet.create({
  section: {
    paddingTop: hp(22),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    marginBottom: hp(14),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginTop: hp(2),
  },
  seeAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  listContent: {
    paddingHorizontal: wp(20),
    gap: wp(12),
  },
  loader: {
    marginVertical: hp(20),
  },
  card: {
    width: wp(160),
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    overflow: 'hidden',
    marginBottom: 5,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  thumb: {
    width: '100%',
    height: hp(90),
  },
  thumbPlaceholder: {
    backgroundColor: colors.uSubHeading,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: wp(10),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(6),
    marginBottom: hp(8),
  },
  tagPill: {
    backgroundColor: colors.uSubHeading,
    paddingHorizontal: wp(7),
    paddingVertical: hp(2),
    borderRadius: wp(5),
  },
  tagText: {
    fontSize: fp(8.5),
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(17),
  },
});