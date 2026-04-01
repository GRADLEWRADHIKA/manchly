import React, { memo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../../../store/CourseSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { getEnrolledCourses } from '../../../../../store/EnrollmentSlice';

const LatestCourseItem = ({ item, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    onPress={onPress}
  >
    {item?.thumbnail_url ? (
      <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
    ) : (
      <View style={[styles.thumb, styles.thumbPlaceholder]}>
        <BookOpen size={wp(22)} color={colors.secPrimary} strokeWidth={1.5} />
      </View>
    )}
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={2}>
        {item?.title}
      </Text>
      {item?.creator?.name && (
        <Text style={styles.creator} numberOfLines={1}>
          {item.creator.name}
        </Text>
      )}
      <Text style={styles.price}>
        {item?.price === 0 ? 'FREE' : `₹${item?.price}`}
      </Text>
    </View>
  </Pressable>
);

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
      <Text style={styles.sectionTitle}>Latest Courses</Text>
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
              navigation.navigate('CourseDetailsScreen', { courseId: item?.id })
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
  sectionTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: '#1C1C1C',
    paddingHorizontal: wp(20),
    marginBottom: hp(14),
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
    backgroundColor: colors.white,
    borderRadius: wp(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: '#F7ECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#1C1C1C',
    lineHeight: fp(17),
    marginBottom: hp(4),
  },
  creator: {
    fontSize: fp(11),
    color: '#6B6059',
    marginBottom: hp(6),
  },
  price: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.secPrimary,
  },
});
