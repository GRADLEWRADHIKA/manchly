import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import {
  BellDot,
  ShoppingCart,
  Search,
  BookOpen,
  PlayCircle,
  User,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import CourseCard from './components/CourseCard';
import { getAllWebinar } from '../../../../store/WebinarSlice';
import WebinarCard from './components/WebinarCard';
import { fetchCourses } from '../../../../store/CourseSlice';
import { wp, hp, fp } from '../../../../utils/responsive';

const { width } = Dimensions.get('window');

const UserHome = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const [webinarData, setWebinarData] = useState([]);
  const focus = useIsFocused();
  const { token } = useSelector((state: any) => state.userReducer);

  useEffect(() => {
    dispatch(getEnrolledCourses({}));
  }, [focus]);

  useEffect(() => {
    funGetAllWebinar(1, 5);
  }, [focus]);

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

  const renderWebinarItem = ({ item }: any) => (
    <View style={styles.courseItem}>
      <WebinarCard data={item} />
    </View>
  );

  // Fetch Webinars
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
      });
  };

  const EmptyCard = ({ icon: Icon, title, btnText, onPress }: any) => (
    <View style={styles.emptyCard}>
      <Icon size={wp(48)} color={colors.secPrimary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>{btnText}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={[styles.mainHeader, { paddingTop: insets.top + hp(10) }]}>
        <View style={styles.mainHead}>
          <View style={{ flexDirection: 'row', gap: wp(5), alignItems: 'center' }}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user?.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={{
                  borderWidth: wp(2),
                  padding: wp(2),
                  borderRadius: wp(50),
                  borderColor: colors.white,
                }}
              >
                <User color={'white'} />
              </View>
            )}
            <Text style={styles.secPara}>{user?.name}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: wp(20) }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('UserCourseSearch')}
          >
            <Search width={wp(22)} height={hp(22)} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity>
            <ShoppingCart width={wp(22)} height={hp(22)} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity>
            <BellDot width={wp(22)} height={hp(22)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(80) }}
      >
        <View style={{ marginTop: hp(16) }}>
          <Carousel
            loop
            width={width}
            height={hp(180)}
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
          <EmptyCard
            icon={BookOpen}
            title="No Courses Enrolled Yet"
            btnText="Browse Courses"
            onPress={() => navigation.navigate('UserCourseSearch')}
          />
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

        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
          Join Webinar
        </Text>

        {webinarData.length === 0 ? (
          <EmptyCard
            icon={PlayCircle}
            title="No Webinars Available"
            btnText="Explore Webinars"
          />
        ) : (
          <FlatList
            horizontal
            data={webinarData}
            renderItem={renderWebinarItem}
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
    backgroundColor: colors.white
  },

  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(16),
    backgroundColor: colors.secPrimary,
  },

  mainHead: {
    flexDirection: 'row',
    gap: wp(5),
    alignItems: 'center'
  },

  avatar: {
    width: wp(34),
    height: hp(34),
    borderRadius: wp(30),
    backgroundColor: colors.lightGrey,
  },

  secPara: {
    color: colors.white,
    fontSize: fp(16),
    fontWeight: '600'
  },

  carouselCard: {
    borderRadius: wp(16),
    overflow: 'hidden',
    marginHorizontal: wp(10),
  },

  carouselImage: {
    width: '100%',
    height: hp(180),
    borderRadius: wp(16)
  },

  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: wp(16),
  },

  carouselText: {
    color: colors.white,
    fontSize: fp(18),
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    marginBottom: hp(12),
  },

  flatListContainer: {
    paddingHorizontal: wp(10)
  },

  courseItem: {
    width: width * 0.45,
    marginRight: wp(14)
  },

  emptyCard: {
    marginHorizontal: wp(16),
    marginTop: hp(20),
    padding: wp(22),
    borderRadius: wp(16),
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: hp(10),
    marginBottom: hp(15),
  },

  emptyButton: {
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(18),
    paddingVertical: hp(10),
    borderRadius: wp(30),
  },

  emptyButtonText: {
    color: colors.white,
    fontWeight: '600'
  },
});
