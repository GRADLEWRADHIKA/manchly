import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Search } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchCourses } from '../../../../store/CourseSlice';
import { getEnrolledCourses } from '../../../../store/EnrollmentSlice';
import CustomTextInput from '../../../../components/CustomInput';
import CourseCard from './component/CourseCard';
import ButtonSection from './component/ButtonSection';

const UserView: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector((state: any) => state.userReducer);
  const { list: allCourses, loading: coursesLoading } = useSelector(
    (state: any) => state.coursesReducer,
  );
  const { list: enrolledCourses } = useSelector(
    (state: any) => state.enrollmentsReducer,
  );
  const [active, setActive] = useState('courses');

  useEffect(() => {
    dispatch(fetchCourses({}));
    dispatch(getEnrolledCourses({}));
  }, []);

  const enrolledCourseIds = (enrolledCourses.enrollments || []).map(
    (e: any) => e.course_id,
  );

  const browseCourses = allCourses?.data?.courses || [];

  const filteredCourses = browseCourses.filter((course: any) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('CourseDetailsScreen', { courseId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroHeading}>
          {active === 'courses' ? 'Learn from experts' : 'Join webinar'}
        </Text>
      </View>
      

      <View style={styles.searchContainer}>
        <Search
          size={18}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />
        <CustomTextInput
          inputContainerStyle={styles.searchInput}
          placeholder="Search courses"
          onChange={setSearchQuery}
          value={searchQuery}
        />
      </View>

      <ButtonSection setActive={setActive} active={active} />

      {active === 'courses' ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Browse Courses</Text>

            <FlatList
              data={filteredCourses}
              keyExtractor={i => i.id || i._id}
              renderItem={({ item }) => {
                const isEnrolled = enrolledCourseIds.includes(
                  item.id || item._id,
                );
                return (
                  <View style={{ paddingHorizontal: 5 }}>
                    <CourseCard
                      item={item}
                      isEnrolled={isEnrolled}
                      userType={user?.user_type}
                      handleCoursePress={handleCoursePress}
                    />
                  </View>
                );
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 200 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No courses found</Text>
                </View>
              }
            />
          </View>
        </>
      ) : (
        ''
      )}
    </View>
  );
};

export default UserView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    padding: 20,
    paddingBottom: 10,
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
  },
  activeTabBtn: {
    backgroundColor: '#5C5CFF',
  },
  tabText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  buttonHeader: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginVertical: 10,
  },
});
