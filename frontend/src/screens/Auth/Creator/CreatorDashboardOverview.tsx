import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Video,
  Users,
  Wallet,
  ChevronRight,
  ArrowUp,
  Plus,
  Video as VideoIcon,
  Users as UsersIcon,
} from 'lucide-react-native';
import AppHeaderWithBack from '../../../components/AppHeaderWithBack';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { getCreatorCourseStats } from '../../../store/CourseSlice';
import { getCreatorWebinarStats } from '../../../store/WebinarSlice';
import {
  getSessionStats,
  getMySessionProducts,
} from '../../../store/SessionSlice';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const CARD_BG = 'rgba(28,27,27,0.70)';
const CARD_BORDER = 'rgba(255,255,255,0.05)';

const fmt = (n: number) => {
  const val = Math.round((n || 0) * 100) / 100;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val}`;
};

const CreatorDashboardOverview: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector(
    (state: any) => state.webinarReducer,
  );
  const { stats: sessionStats, products: sessionProducts } = useSelector(
    (state: any) => state.sessionReducer,
  );
  console.log('SESSION STATS', JSON.stringify(sessionStats, null, 2));

  useFocusEffect(
    useCallback(() => {
      dispatch(getCreatorCourseStats());
      dispatch(getCreatorWebinarStats());
      dispatch(getSessionStats());
      dispatch(getMySessionProducts());
    }, [dispatch]),
  );

  const courseRevenue = creatorStats?.statistics?.revenue || 0;
  const webinarRevenue = creatorWebinarStats?.statistics?.revenue || 0;
  const sessionRevenue = sessionStats?.total_earnings || 0;
  const totalRevenue = courseRevenue + webinarRevenue + sessionRevenue;

  const courseEnrolled = creatorStats?.statistics?.total_enrollments || 0;
  const webinarEnrolled =
    creatorWebinarStats?.statistics?.total_enrollments || 0;
  const sessionBooked = sessionStats?.total_sessions || 0;
  const totalEnrolled = courseEnrolled + webinarEnrolled + sessionBooked;

  const totalCourses = creatorStats?.statistics?.total_courses || 0;
  const totalWebinars = creatorWebinarStats?.statistics?.total_webinars || 0;
  const totalSessionProducts = sessionProducts?.length || 0;
  const totalProducts = totalCourses + totalWebinars + totalSessionProducts;

  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <AppHeaderWithBack
        title="Dashboard"
        bgColor="transparent"
        textColor="#FFF"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + hp(30) },
        ]}
      >
        {/* Hero Revenue Card */}
        <LinearGradient
          colors={['rgba(214,156,63,0.18)', 'rgba(28,27,27,0.85)']}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTextBox}>
            <Text style={styles.heroLabel}>Total Revenue</Text>
            <Text style={styles.heroValue}>{fmt(totalRevenue)}</Text>

            <View style={styles.growthPill}>
              <ArrowUp size={wp(10)} color="#10B981" strokeWidth={3} />
              <Text style={styles.growthPillText}>+28%</Text>
            </View>
            <Text style={styles.growthSub}>vs last month</Text>
          </View>

          <Image
            source={require('../../../image/pocket.jpg')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </LinearGradient>

        {/* Enrolled / Products pair */}
        <View style={styles.pairRow}>
          <View style={styles.pairCard}>
            <View
              style={[
                styles.pairIconWrap,
                { backgroundColor: 'rgba(96,165,250,0.15)' },
              ]}
            >
              <Users size={wp(18)} color="#60A5FA" strokeWidth={2} />
            </View>
            <Text style={styles.pairLabel}>Total Users</Text>
            <Text style={styles.pairValue}>{totalEnrolled}</Text>
          </View>
          <View style={styles.pairCard}>
            <View
              style={[
                styles.pairIconWrap,
                { backgroundColor: 'rgba(168,85,247,0.15)' },
              ]}
            >
              <BookOpen size={wp(18)} color="#A855F7" strokeWidth={2} />
            </View>
            <Text style={styles.pairLabel}>Total Products</Text>
            <Text style={styles.pairValue}>{totalProducts}</Text>
            <Text style={styles.pairSubtext}>
              {totalCourses} Courses • {totalWebinars} Webinars •{' '}
              {totalSessionProducts} Sessions
            </Text>
          </View>
        </View>

        {/* Product Performance */}
        <Text style={styles.sectionTitle}>Product Performance</Text>
        <View style={styles.performanceCard}>
          <TouchableOpacity
            style={styles.perfRow}
            activeOpacity={0.7}
            onPress={() => {
              console.log('Navigating to Dashboard with tab: Course');
              navigation.navigate('Dashboard', { initialTab: 'Course' });
            }}
          >
            <View style={styles.perfIconWrap}>
              <BookOpen size={wp(18)} color={GOLD_CREAM} strokeWidth={2} />
            </View>
            <View style={styles.perfInfo}>
              <Text style={styles.perfTitle}>Courses</Text>
              <Text style={styles.perfSubtitle}>
                {totalCourses} products • {courseEnrolled} users
              </Text>
            </View>
            <View style={styles.perfRightWrap}>
              <Text style={styles.perfRevenue}>{fmt(courseRevenue)}</Text>
              <ChevronRight size={wp(16)} color="rgba(255,255,255,0.35)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.perfRow, styles.perfRowBorder]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Dashboard', { initialTab: 'Webinar' })
            }
          >
            <View style={styles.perfIconWrap}>
              <Video size={wp(18)} color={GOLD_CREAM} strokeWidth={2} />
            </View>
            <View style={styles.perfInfo}>
              <Text style={styles.perfTitle}>Webinars</Text>
              <Text style={styles.perfSubtitle}>
                {totalWebinars} products • {webinarEnrolled} users
              </Text>
            </View>
            <View style={styles.perfRightWrap}>
              <Text style={styles.perfRevenue}>{fmt(webinarRevenue)}</Text>
              <ChevronRight size={wp(16)} color="rgba(255,255,255,0.35)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.perfRow, styles.perfRowBorder]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Dashboard', { initialTab: '1:1 Session' })
            }
          >
            <View style={styles.perfIconWrap}>
              <Users size={wp(18)} color={GOLD_CREAM} strokeWidth={2} />
            </View>
            <View style={styles.perfInfo}>
              <Text style={styles.perfTitle}>1:1 Sessions</Text>
              <Text style={styles.perfSubtitle}>
                {totalSessionProducts} products • {sessionBooked} booked
              </Text>
            </View>
            <View style={styles.perfRightWrap}>
              <Text style={styles.perfRevenue}>{fmt(sessionRevenue)}</Text>
              <ChevronRight size={wp(16)} color="rgba(255,255,255,0.35)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: hp(20) }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('CreateCourse')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <Plus size={wp(18)} color={GOLD_CREAM} strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Create Course</Text>
            <Text style={styles.quickActionSubtitle}>Start teaching today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('CreateWebinar')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <VideoIcon size={wp(18)} color={GOLD_CREAM} strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Schedule Webinar</Text>
            <Text style={styles.quickActionSubtitle}>
              Go live with your audience
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              navigation.navigate('AllSessions');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionIconWrap}>
              <UsersIcon size={wp(18)} color={GOLD_CREAM} strokeWidth={2.2} />
            </View>
            <Text style={styles.quickActionTitle}>Add 1:1 Session</Text>
            <Text style={styles.quickActionSubtitle}>Connect personally</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorDashboardOverview;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  scrollContent: { paddingHorizontal: wp(16), paddingTop: hp(6) },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(18),
    borderWidth: 1,
    borderColor: 'rgba(214,156,63,0.3)',
    paddingVertical: hp(16),
    paddingLeft: wp(18),
    paddingRight: wp(8),
    marginBottom: hp(14),
    overflow: 'hidden',
  },
  heroIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    backgroundColor: 'rgba(214,156,63,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
  },
  heroLabel: {
    fontSize: fp(12.5),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    marginBottom: hp(4),
  },
  heroValue: {
    fontSize: fp(30),
    fontWeight: '800',
    color: colors.white,
  },
  heroTextBox: {
    flex: 1,
  },
  pairRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(20),
  },
  pairCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: wp(12),
  },
  pairIconWrap: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  pairLabel: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginBottom: hp(2),
  },
  pairValue: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  pairSubtext: {
    fontSize: fp(9.5),
    color: 'rgba(255,255,255,0.4)',
    marginTop: hp(4),
  },

  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(10),
  },
  performanceCard: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: wp(14),
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
  },
  perfRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  perfIconWrap: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(11),
    backgroundColor: 'rgba(214,156,63,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  perfInfo: { flex: 1 },
  perfTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(2),
  },
  perfSubtitle: {
    fontSize: fp(11.5),
    color: 'rgba(255,255,255,0.5)',
  },
  perfRevenue: {
    fontSize: fp(14),
    fontWeight: '700',
    color: GOLD_CREAM,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: wp(12),
  },
  quickActionIconWrap: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(9),
    backgroundColor: 'rgba(214,156,63,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(10),
  },
  quickActionTitle: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(3),
  },
  quickActionSubtitle: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: fp(13),
  },
  heroImage: {
    width: wp(120),
    height: wp(110),
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(3),
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderRadius: wp(8),
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    marginTop: hp(10),
  },
  growthPillText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#10B981',
  },
  growthSub: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.45)',
    marginTop: hp(4),
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
    borderRadius: wp(18),
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  perfRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
});
