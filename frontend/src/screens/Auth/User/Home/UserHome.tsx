import React, { memo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar as RNStatusBar,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { BellDot, ShoppingCart, Search } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import CourseCard from './components/CourseCard';

const { width } = Dimensions.get('window');

const UserHome = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();

  useEffect(() => {
    dispatch(getEnrolledCourses({}));
  }, []);

  const { list: enrolledCourses, loading: enrolledLoading } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );

  const carouselData = [
    {
      title: 'Learn Anytime, Anywhere',
      image:
        'https://img.freepik.com/free-vector/online-courses-tutorials_23-2148527797.jpg',
    },
    {
      title: 'Upgrade Your Skills Today',
      image:
        'https://img.freepik.com/free-vector/education-concept-illustration_114360-6266.jpg',
    },
    {
      title: 'Grow with the Best Instructors',
      image:
        'https://img.freepik.com/free-vector/elearning-concept-illustration_114360-6217.jpg',
    },
  ];

  const renderCourseItem = ({ item }: any) => (
    <View style={styles.courseItem}>
      <CourseCard item={item} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <RNStatusBar barStyle="light-content" />
      <View style={[styles.mainHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.mainHead}>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            <Image
              source={{ uri: user?.profile_image }}
              style={styles.avatar}
            />
            <Text style={styles.secPara}>{user?.name}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('UserCourseSearch');
            }}
          >
            <Search width={22} height={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity>
            <ShoppingCart width={22} height={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity>
            <BellDot width={22} height={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View style={{ marginTop: 16 }}>
          <Carousel
            loop
            width={width}
            height={180}
            autoPlay
            data={carouselData}
            scrollAnimationDuration={1500}
            renderItem={({ item }) => (
              <View style={styles.carouselCard}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselText}>{item.title}</Text>
                </View>
              </View>
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Your Courses</Text>

        {enrolledLoading ? (
          <ActivityIndicator size="large" color={colors.secPrimary} />
        ) : enrolledCourses?.enrollments?.length === 0 ? (
          <Text style={styles.emptyText}>
            You haven’t enrolled in any course yet.
          </Text>
        ) : (
          <FlatList
            horizontal
            data={enrolledCourses?.enrollments}
            renderItem={renderCourseItem}
            keyExtractor={(item: any) => item.id?.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContainer}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default memo(UserHome);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.secPrimary,
  },
  mainHead: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 30,
    backgroundColor: colors.lightGrey,
  },
  secPara: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  carouselCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  carouselImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  carouselText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  flatListContainer: {
    paddingHorizontal: 10,
  },
  courseItem: {
    width: width * 0.45, // 2 cards visible at once
    marginRight: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 40,
  },
});
