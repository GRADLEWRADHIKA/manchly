// screens/Auth/User/Products/component/ProductsScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, Star, Bell } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

// ── Mock Data matching the UI ───────────────────────────────────────────────
const FEATURED_COURSE = {
  title: 'Mastering Advanced Quant Trading Strategies',
  subtitle: 'Learn to build, backtest, and deploy high-frequency algorithmic trading systems using Python and real-time market data APIs.',
  price: '₹199',
  originalPrice: '₹1,999',
  rating: '4.9',
  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
};

const POPULAR_COURSES = [
  {
    id: '1',
    title: 'Advanced Neural Networks & DL',
    duration: '18h 45m',
    rating: '4.8',
    price: '₹249',
    level: 'INTERMEDIATE',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=200',
  },
  {
    id: '2',
    title: 'Technical Writing for Engineers',
    duration: '09h 20m',
    rating: '4.5',
    price: 'Free',
    level: 'BEGINNER',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200',
  },
  {
    id: '3',
    title: 'Advanced UI Design Systems',
    duration: '12h 15m',
    rating: '4.7',
    price: '₹399',
    level: 'EXPERT',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200',
  },
];

const UPCOMING_WEBINARS = [
  {
    id: '1',
    title: 'State Management: Redux vs Zustand vs Jotai',
    desc: 'Architectural benefits and performance of modern state libraries.',
    date: '05 Jul, 03:00 PM',
    host: 'Shrikant Chauhan',
    price: '₹299',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
  },
  {
    id: '2',
    title: 'Mastering Mobile UI/UX Design Systems',
    desc: 'Scalable design languages for cross-platform mobile experiences.',
    date: '06 Jul, 11:00 AM',
    host: 'Ananya Sharma',
    price: '₹149',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
  },
];

const FACULTY_MEMBERS = [
  {
    id: '1',
    name: 'Shrikant Chauhan',
    role: 'Lead Dev at TechFlow',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
];

const ProductsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Courses' | 'Webinars'>('Courses');

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Text style={styles.brandTitle}>Manchly</Text>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
          <Bell size={22} color={colors.cText} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeFilter === 'Courses' ? (
          <>
            {/* Hero Heading */}
            <Text style={styles.heroTitle}>Explore Knowledge</Text>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Search size={16} color={colors.cTextMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search webinars, topics, or experts..."
                placeholderTextColor={colors.cTextMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter Toggle Row */}
            <View style={styles.filterRow}>
              {['Courses', 'Webinars'].map((filter: any) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterPill,
                    activeFilter === filter && styles.filterPillActive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      activeFilter === filter && styles.filterPillTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Featured Course Card */}
            <View style={styles.featuredCourseCard}>
              <View style={styles.featuredContentRow}>
                <View style={styles.featuredTextContent}>
                  <View style={styles.badgeRow}>
                    <View style={styles.featuredAccentBadge}>
                      <Text style={styles.featuredAccentBadgeText}>FEATURED</Text>
                    </View>
                    <View style={styles.starMetaRow}>
                      <Star size={10} color={colors.gold} fill={colors.gold} />
                      <Text style={styles.featuredMetaText}>{FEATURED_COURSE.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.featuredCourseTitle}>{FEATURED_COURSE.title}</Text>
                  <Text style={styles.featuredCourseDesc} numberOfLines={3}>
                    {FEATURED_COURSE.subtitle}
                  </Text>

                  <View style={styles.featuredActionFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.featuredCoursePrice}>{FEATURED_COURSE.price}</Text>
                      <Text style={styles.featuredOriginalPrice}>{FEATURED_COURSE.originalPrice}</Text>
                    </View>
                    <TouchableOpacity style={styles.enrollBtn} activeOpacity={0.8}>
                      <Text style={styles.enrollBtnText}>Enroll Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Image source={{ uri: FEATURED_COURSE.image }} style={styles.featuredSideImage} />
              </View>
            </View>

            {/* Popular Courses Title Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Courses</Text>
            </View>

            {POPULAR_COURSES.map(course => (
              <TouchableOpacity key={course.id} style={styles.popularCourseCard} activeOpacity={0.8}>
                <Image source={{ uri: course.image }} style={styles.courseThumbnailImage} />
                <View style={styles.popularCourseCardInfo}>
                  <View style={styles.pillBadgeContainer}>
                    <Text style={styles.pillBadgeText}>{course.level}</Text>
                  </View>
                  <Text style={styles.popularCourseTitle} numberOfLines={1}>{course.title}</Text>
                  <Text style={styles.courseDurationText}>🕒 {course.duration}  ★ {course.rating}</Text>
                  <View style={styles.courseBottomActionRow}>
                    <Text style={styles.coursePriceTag}>{course.price}</Text>
                    <TouchableOpacity style={styles.addButtonCircle} activeOpacity={0.7}>
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Learn from the Best Section */}
            <View style={[styles.sectionHeader, { marginTop: hp(24) }]}>
              <Text style={styles.sectionTitle}>Learn from the Best</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            {FACULTY_MEMBERS.map(faculty => (
              <View key={faculty.id} style={styles.facultyCircularCard}>
                <Image source={{ uri: faculty.avatar }} style={styles.facultyImageCircle} />
                <Text style={styles.facultyCardName}>{faculty.name}</Text>
                <Text style={styles.facultyCardRole}>{faculty.role}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            {/* Webinar Welcome Hero Card */}
            <View style={styles.webinarWelcomeHeroCard}>
              <Text style={styles.webinarHeroGreeting}>Hey Shrikant 👋</Text>
              <Text style={styles.webinarHeroTitle}>Join Live Webinars</Text>
              <Text style={styles.webinarHeroDesc}>
                Attend live sessions with world-class experts and scale your knowledge in real-time.
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Search size={16} color={colors.cTextMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search webinars, topics, or experts..."
                placeholderTextColor={colors.cTextMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter Toggle Row */}
            <View style={styles.filterRow}>
              {['Courses', 'Webinars'].map((filter: any) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterPill,
                    activeFilter === filter && styles.filterPillActive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      activeFilter === filter && styles.filterPillTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upcoming Webinars Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Webinars</Text>
              <View style={styles.upcomingCountBadge}>
                <Text style={styles.upcomingCountText}>• 2 upcoming</Text>
              </View>
            </View>

            {UPCOMING_WEBINARS.map(webinar => (
              <View key={webinar.id} style={styles.webinarItemCard}>
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: webinar.image }} style={styles.webinarCoverImage} />
                  <View style={styles.priceOverlayBadge}>
                    <Text style={styles.priceOverlayText}>{webinar.price}</Text>
                  </View>
                </View>
                <View style={styles.webinarDetailsContent}>
                  <Text style={styles.webinarItemTitle}>{webinar.title}</Text>
                  <Text style={styles.webinarItemDesc} numberOfLines={2}>{webinar.desc}</Text>
                  <Text style={styles.webinarMetaLineText}>📅 {webinar.date}</Text>
                  <Text style={styles.webinarMetaLineText}>👤 {webinar.host}</Text>
                  <TouchableOpacity style={styles.registerWebinarBtn} activeOpacity={0.8}>
                    <Text style={styles.registerWebinarBtnText}>Register Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Expert Faculty Section */}
            <View style={[styles.sectionHeader, { marginTop: hp(24) }]}>
              <Text style={styles.sectionTitle}>Expert Faculty</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See All ›</Text>
              </TouchableOpacity>
            </View>

            {FACULTY_MEMBERS.map(faculty => (
              <View key={faculty.id} style={styles.facultyCircularCard}>
                <Image source={{ uri: faculty.avatar }} style={styles.facultyImageCircle} />
                <Text style={styles.facultyCardName}>{faculty.name}</Text>
                <Text style={styles.facultyCardRole}>{faculty.role}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(30),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.cBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.cBorder,
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
  },
  iconButton: {
    padding: wp(4),
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp(4),
    right: wp(4),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.cAccentLight,
  },
  heroTitle: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.white,
    marginTop: hp(16),
    marginBottom: hp(14),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cBorder,
    paddingHorizontal: wp(14),
    height: hp(44),
    gap: wp(10),
    marginBottom: hp(16),
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: fp(13),
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(20),
  },
  filterPill: {
    paddingHorizontal: wp(18),
    paddingVertical: hp(8),
    borderRadius: 99,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  filterPillActive: {
    backgroundColor: colors.cAccentLight,
    borderColor: colors.cAccentLight,
  },
  filterPillText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.cTextSecondary,
  },
  filterPillTextActive: {
    color: colors.white,
  },

  // Left Image Split Architecture for Featured Course
  featuredCourseCard: {
    backgroundColor: colors.cSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cBorder,
    overflow: 'hidden',
    marginBottom: hp(24),
    padding: wp(14),
  },
  featuredContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: wp(12),
  },
  featuredTextContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(8),
  },
  featuredAccentBadge: {
    backgroundColor: colors.goldDim,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: 6,
  },
  featuredAccentBadgeText: {
    fontSize: fp(9),
    color: colors.gold,
    fontWeight: '700',
  },
  starMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  featuredMetaText: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    fontWeight: '600',
  },
  featuredCourseTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    lineHeight: fp(20),
    marginBottom: hp(6),
  },
  featuredCourseDesc: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    lineHeight: fp(16),
    marginBottom: hp(14),
  },
  featuredActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  featuredCoursePrice: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white,
  },
  featuredOriginalPrice: {
    fontSize: fp(11),
    color: colors.cTextMuted,
    textDecorationLine: 'line-through',
  },
  enrollBtn: {
    backgroundColor: colors.cAccentLight,
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: 8,
  },
  enrollBtnText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '700',
  },
  featuredSideImage: {
    width: wp(100),
    height: hp(130),
    borderRadius: 10,
  },

  // Popular Course Styles
  popularCourseCard: {
    flexDirection: 'row',
    backgroundColor: colors.cSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cBorderLight,
    padding: wp(10),
    gap: wp(12),
    marginBottom: hp(12),
    alignItems: 'center',
  },
  courseThumbnailImage: {
    width: wp(80),
    height: wp(80),
    borderRadius: 10,
  },
  popularCourseCardInfo: {
    flex: 1,
  },
  pillBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    marginBottom: hp(4),
  },
  pillBadgeText: {
    fontSize: fp(8),
    color: colors.cTextMuted,
    fontWeight: '700',
  },
  popularCourseTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(4),
  },
  courseDurationText: {
    fontSize: fp(10),
    color: colors.cTextMuted,
    marginBottom: hp(6),
  },
  courseBottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coursePriceTag: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
  addButtonCircle: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.cBorder,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fp(14),
    lineHeight: fp(16),
  },

  // Webinar Sub-Layout Styling structures
  webinarWelcomeHeroCard: {
    backgroundColor: colors.cSurface,
    borderRadius: 16,
    padding: wp(16),
    marginTop: hp(16),
    marginBottom: hp(16),
  },
  webinarHeroGreeting: {
    fontSize: fp(11),
    color: colors.gold,
    fontWeight: '600',
    marginBottom: hp(4),
  },
  webinarHeroTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(6),
  },
  webinarHeroDesc: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    lineHeight: fp(17),
  },
  upcomingCountBadge: {
    backgroundColor: 'rgba(26, 86, 219, 0.15)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: 6,
  },
  upcomingCountText: {
    fontSize: fp(10),
    color: colors.faaAiPrimary,
    fontWeight: '600',
  },
  webinarItemCard: {
    backgroundColor: colors.cSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cBorderLight,
    overflow: 'hidden',
    marginBottom: hp(16),
  },
  webinarCoverImage: {
    width: '100%',
    height: hp(130),
  },
  priceOverlayBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: 6,
  },
  priceOverlayText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '700',
  },
  webinarDetailsContent: {
    padding: wp(14),
  },
  webinarItemTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(4),
  },
  webinarItemDesc: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    lineHeight: fp(16),
    marginBottom: hp(10),
  },
  webinarMetaLineText: {
    fontSize: fp(11),
    color: colors.cTextMuted,
    marginBottom: hp(4),
  },
  registerWebinarBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.cBorder,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    marginTop: hp(12),
  },
  registerWebinarBtnText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '600',
  },

  // Faculty Layout Definitions
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(14),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  seeAllText: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
  },
  facultyCircularCard: {
    backgroundColor: colors.cSurface,
    borderRadius: 16,
    padding: wp(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cBorderLight,
  },
  facultyImageCircle: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    marginBottom: hp(10),
  },
  facultyCardName: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },
  facultyCardRole: {
    fontSize: fp(11),
    color: colors.cTextMuted,
    marginTop: hp(2),
  },
});