import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {
  Bell,
  ChevronRight,
  BookOpen,
  Users,
  Calendar,
  Instagram,
  Video as VideoIcon,
  Rocket,
  Play,
} from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path as SvgPath } from 'react-native-svg';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import KycCard from './KeyCard';
import QuickActions from './QuickActions';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RocketIcon from '../../../../components/RocketIcon';
import { getCreatorSales } from '../../../../store/PaymentSlice';
import { getCreatorCourseStats } from '../../../../store/CourseSlice';
import { getCreatorWebinarStats } from '../../../../store/WebinarSlice';
import { getSessionStats } from '../../../../store/SessionSlice';
import { instance } from '../../../../utils/AxiosInstance';
import { clearJustLoggedIn } from '../../../../store/UserSlice';
import FloatingIntroVideo from '../../../../components/FloatingIntroVideo';
import CoursePlannerModal from '../../../../components/ai/CoursePlanner';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector(
    (state: any) => state.webinarReducer,
  );
  const { stats: sessionStats } = useSelector(
    (state: any) => state.sessionReducer,
  );
  const insets = useSafeAreaInsets();
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const { justLoggedIn } = useSelector((state: any) => state.userReducer);
  const focus = useIsFocused();
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [showCoursePlannerModal, setShowCoursePlannerModal] = useState(false);

  useEffect(() => {
    if (justLoggedIn) {
      setShowIntroVideo(true);
      dispatch(clearJustLoggedIn());
    }
  }, [justLoggedIn]);

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const [walletRes, bankRes] = await Promise.all([
        instance.get('settlements/wallet').catch((e: any) => {
          console.log(
            'Wallet API error:',
            e?.response?.status,
            e?.response?.data,
          );
          return null;
        }),
        instance.get('settlements/bank-account').catch((e: any) => {
          if (e?.response?.status !== 404) {
            console.log('Bank API error:', e?.response?.status);
          }
          return null;
        }),
      ]);
      setWalletData(walletRes?.data?.data?.wallet || null);
    } catch (error) {
      console.log('Error fetching wallet:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, []),
  );

  useEffect(() => {
    dispatch(getCreatorSales({}));
    dispatch(getCreatorCourseStats());
    dispatch(getCreatorWebinarStats());
    dispatch(getSessionStats());
  }, []);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  const totalRevenueAmount = walletData?.total_net_earnings || 0;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.greeting}>
                Hello {displayName?.split(' ')[0]},
              </Text>
              <Text style={styles.greetingSub}>{getGreeting()}</Text>
            </View>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}
          >
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setShowIntroVideo(true)}
            >
              <Play size={wp(18)} color={colors.white} fill={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() =>
                Linking.openURL('https://www.instagram.com/manchly_app')
              }
            >
              <Instagram size={wp(20)} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('CreatorNotification')}
            >
              <Bell size={wp(20)} color={colors.white} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* KYC Card — hidden once identity is verified */}
        {!user?.kyc_verified && (
          <View style={styles.sectionPadding}>
            <KycCard />
          </View>
        )}

        {/* Revenue + Performance split row */}
        <View style={[styles.sectionPadding, styles.splitRow]}>
          {/* Revenue mini card */}
          <View style={styles.revenueMiniCard}>
            <Text style={styles.miniLabel}>REVENUE</Text>
            <Text style={styles.revenueMiniAmount}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              {walletLoading ? '...' : formatAmount(totalRevenueAmount)}
            </Text>
            <Svg
              width={wp(150)}
              height={hp(38)}
              viewBox="0 0 150 38"
              style={styles.sparkline}
            >
              <SvgPath
                d="M0 28 C 15 30, 25 10, 40 14 C 55 18, 60 32, 78 24 C 95 16, 100 4, 118 8 C 130 11, 138 2, 150 6"
                stroke={colors.golden}
                strokeWidth={2.2}
                fill="none"
                strokeLinecap="round"
              />
              <SvgCircle cx={150} cy={6} r={3.5} fill={colors.golden} />
            </Svg>
          </View>

          {/* Performance mini card */}
          <View style={styles.performanceMiniCard}>
            <Text style={[styles.miniLabel, { color: colors.white }]}>
              PERFORMANCE
            </Text>
            <View style={styles.perfRow}>
              <BookOpen size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Courses</Text>
              <Text style={styles.perfValue}>
                {creatorStats?.statistics?.total_courses ?? 0}
              </Text>
            </View>
            <View style={styles.perfRow}>
              <Users size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Users</Text>
              <Text style={styles.perfValue}>
                {(creatorStats?.statistics?.total_enrollments ?? 0) +
                  (creatorWebinarStats?.statistics?.total_enrollments ?? 0) +
                  (sessionStats?.total_sessions ?? 0)}
              </Text>
            </View>
            <View style={styles.perfRow}>
              <VideoIcon size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Webinars</Text>
              <Text style={styles.perfValue}>
                {creatorWebinarStats?.statistics?.total_webinars ?? 0}
              </Text>
            </View>
            <View style={styles.perfRow}>
              <Calendar size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Sessions</Text>
              <Text style={styles.perfValue}>
                {sessionStats?.total_sessions ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Launch / Course Progress Card */}
        <View style={styles.sectionPadding}>
          <LinearGradient
            colors={['#1E1E1E', '#141414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.launchCard}
          >
            <View style={styles.launchHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.launchTitle}>
                  Launch Your{' '}
                  {creatorStats?.statistics?.courses_sold ? 'Next' : 'First'}{' '}
                  Course
                </Text>
                <Text style={styles.launchSubtitle}>
                  Turn your expertise into income.{'\n'}Publish your course and
                  go live.
                </Text>
              </View>
              <View style={styles.rocketBox}>
                <RocketIcon size={wp(32)} color="rgba(213,196,171,0.6)" />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateCourse');
                } else {
                  navigation.navigate('KYCVerificationScreen');
                }
              }}
            >
              <LinearGradient
                colors={['#F3C36B', '#D49A3D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>Get Started</Text>
                <ChevronRight size={wp(18)} color={colors.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <QuickActions />

        {/* AI Course Planner Card */}
        <View style={styles.sectionPadding}>
          <TouchableOpacity
            style={styles.toolCard}
            activeOpacity={0.75}
            onPress={() => setShowCoursePlannerModal(true)}
          >
            <View style={styles.toolIconWrap}>
              <Rocket size={wp(22)} color={colors.white} />
            </View>
            <Text style={styles.toolTitle}>AI Course Planner</Text>
            <Text style={styles.toolDescription}>
              Turn any niche into a full go-to-market plan — curriculum, ads, and revenue forecast.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FloatingIntroVideo
        visible={showIntroVideo}
        onClose={() => setShowIntroVideo(false)}
      />

      <CoursePlannerModal
        visible={showCoursePlannerModal}
        onClose={() => setShowCoursePlannerModal(false)}
      />
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  // Header
  headerWrapper: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: colors.golden,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.black,
  },
  greeting: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.white,
  },
  greetingSub: {
    fontSize: fp(13),
    color: colors.muted,
    fontWeight: '500',
    marginTop: hp(2),
  },
  bellBtn: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bellDot: {
    position: 'absolute',
    top: wp(10),
    right: wp(12),
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: colors.error,
  },

  scrollContent: {
    paddingBottom: hp(30),
  },
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },

  // Split row: revenue + performance
  splitRow: {
    flexDirection: 'row',
    gap: wp(12),
  },
  revenueMiniCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(18),
    padding: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'space-between',
  },
  performanceMiniCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(18),
    padding: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  miniLabel: {
    fontSize: fp(10.5),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: hp(6),
  },
  revenueMiniAmount: {
    fontSize: fp(22),
    fontWeight: '800',
    color: colors.white,
  },
  rupeeSymbol: {
    fontSize: fp(15),
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  sparkline: {
    marginTop: hp(8),
    alignSelf: 'center',
  },
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(9),
  },
  perfLabel: {
    flex: 1,
    fontSize: fp(11.5),
    color: '#D5C4AB',
    fontWeight: '500',
  },
  perfValue: {
    fontSize: fp(13),
    fontWeight: '800',
    color: colors.white,
  },

  // Launch Card
  launchCard: {
    borderRadius: wp(20),
    padding: wp(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  launchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(16),
  },
  launchTitle: {
    fontSize: fp(19),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(25),
  },
  launchSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(19),
    marginTop: hp(6),
  },
  rocketBox: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: 'rgba(213,196,171,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(8),
    transform: [{ rotate: '-12deg' }],
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    borderRadius: wp(14),
    paddingVertical: hp(14),
  },
  ctaText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.primary,
  },

  // AI Tool Card
  toolCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: wp(22),
    padding: wp(20),
  },
  toolIconWrap: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(14),
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
  },
  toolTitle: {
    fontSize: fp(17),
    fontWeight: '600',
    color: colors.white,
    marginBottom: hp(8),
  },
  toolDescription: {
    fontSize: fp(13),
    color: '#D9C7A3',
    lineHeight: fp(19),
  },
});