import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../../../store/CourseSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { getEnrolledCourses } from '../../../../../store/EnrollmentSlice';
import ShimmerBox from '../../../../../components/ShimmerBox';

const CardSkeleton = () => (
  <View style={styles.card}>
    <ShimmerBox width={wp(160)} height={hp(90)} radius={0} />
    <View style={styles.info}>
      <ShimmerBox width={wp(60)} height={hp(12)} radius={5} />
      <ShimmerBox
        width={wp(130)}
        height={hp(13)}
        radius={5}
        style={{ marginTop: hp(10) }}
      />
      <ShimmerBox
        width={wp(80)}
        height={hp(11)}
        radius={5}
        style={{ marginTop: hp(8) }}
      />
      <ShimmerBox
        width={wp(50)}
        height={hp(15)}
        radius={5}
        style={{ marginTop: hp(8) }}
      />
    </View>
  </View>
);

const LatestCourseItem = ({ item, onPress }: any) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item?.thumbnail) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [item?.thumbnail]);

  const iconScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const iconOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {item?.thumbnail ? (
        <Image source={{ uri: item?.thumbnail }} style={styles.thumb} />
      ) : (
        <LinearGradient
          colors={['#3D4573', '#2A2F52']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.thumb, styles.thumbPlaceholder]}
        >
          <Animated.View
            style={[
              styles.placeholderIconWrap,
              { transform: [{ scale: iconScale }], opacity: iconOpacity },
            ]}
          >
            <BookOpen size={wp(22)} color="#93B4FF" strokeWidth={1.8} />
          </Animated.View>
          <Text style={styles.placeholderLabel} numberOfLines={1}>
            {item?.category || 'COURSE'}
          </Text>
        </LinearGradient>
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
        <Text style={styles.title} numberOfLines={1}>
          {item?.title}
        </Text>
        {item?.creator?.name && (
          <Text style={styles.creator} numberOfLines={1}>
            by {item.creator.name}
          </Text>
        )}
        <Text style={styles.price}>
          {Number(item?.price) > 0 ? `₹${item.price}` : 'Free'}
        </Text>
      </View>
    </Pressable>
  );
};

const LatestCourses = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { list: allCourses, loading } = useSelector(
    (state: any) => state.coursesReducer,
  );
  const browseCourses = allCourses?.data?.courses || [];
  const showSkeleton = loading && browseCourses.length === 0;
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
        <Pressable
          style={styles.seeAllBtn}
          hitSlop={8}
          onPress={() =>
            navigation.navigate('UserBottomTab', {
              screen: 'ProductsScreen',
              params: { initialTab: 'Courses', ts: Date.now() },
            })
          }
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={wp(14)} color="rgba(255,255,255,0.7)" strokeWidth={2} />
        </Pressable>
      </View>
      {showSkeleton ? (
        <View style={[styles.listContent, styles.skeletonRow]}>
          {[0, 1, 2].map(i => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={browseCourses.slice(0, 5)}
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
      )}
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
  skeletonRow: {
    flexDirection: 'row',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(6),
  },
  placeholderIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: 'rgba(147,180,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#93B4FF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    paddingHorizontal: wp(7),
    paddingVertical: hp(2),
    borderRadius: wp(5),
  },
  tagText: {
    fontSize: fp(8.5),
    fontWeight: '700',
    color: '#93B4FF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(17),
  },
  creator: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(4),
  },
  price: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.info,
    marginTop: hp(6),
  },
});