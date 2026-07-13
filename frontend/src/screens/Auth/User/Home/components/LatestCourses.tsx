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

const ACCENT = '#4F60FA';
const CARD_BG = '#1E1B2E';
const PLACEHOLDER_BG = '#2A2740';

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
          <BookOpen size={wp(22)} color={ACCENT} strokeWidth={1.5} />
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
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
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
    backgroundColor: CARD_BG,
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
    backgroundColor: PLACEHOLDER_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
    lineHeight: fp(17),
    marginBottom: hp(4),
  },
  creator: {
    fontSize: fp(11),
    color: '#9C98AE',
    marginBottom: hp(6),
  },
  price: {
    fontSize: fp(13),
    fontWeight: '700',
    color: ACCENT,
  },
});