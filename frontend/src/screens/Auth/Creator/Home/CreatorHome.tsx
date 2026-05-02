import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {
  Bell,
  ChevronRight,
  Sparkles,
  Lightbulb,
  PenLine,
  Rocket,
  TrendingUp,
  BookOpen,
  Users,
  Award,
  Check,
  Circle,
  Star,
  HelpCircle,
  Instagram,
} from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import KycCard from './KeyCard';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { getCreatorSales } from '../../../../store/PaymentSlice';
import {
  fetchCourses,
  getCreatorCourseStats,
} from '../../../../store/CourseSlice';
import {
  getAllWebinar,
  getCreatorWebinarStats,
} from '../../../../store/WebinarSlice';
import { instance } from '../../../../utils/AxiosInstance';
import Video from 'react-native-video';
import { X, Play, Maximize2 } from 'lucide-react-native';
import { clearJustLoggedIn } from '../../../../store/UserSlice';

const INTRO_VIDEO_URL =
  'https://stream.mux.com/aiFSECiPT501KG02eutUYBTKc8aPPOz27ikxTnTHaKJJ00.m3u8';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { totalRevenue } = useSelector((state: any) => state.paymentReducer);
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector(
    (state: any) => state.webinarReducer,
  );
  const insets = useSafeAreaInsets();
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const { justLoggedIn } = useSelector((state: any) => state.userReducer);
  const focus = useIsFocused();
  const [courses, setCourses] = useState<any[]>([]);
  const [webiniarData, setWebinarData] = useState<any[]>([]);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (justLoggedIn) {
      setShowIntroVideo(true);
      dispatch(clearJustLoggedIn());
    }
  }, [justLoggedIn]);

  useEffect(() => {
    getTheCourse();
    fetchWebinars();
  }, [focus]);

  const getTheCourse = () => {
    const payload = {
      page: 1,
      limit: 10,
      my_courses: true,
    };

    dispatch(fetchCourses(payload))
      .unwrap()
      .then(response => {
        const newData = response?.data?.data?.courses || [];
        setCourses(newData);
        console.log(courses.length);
      })
      .finally(() => {});
  };

  const fetchWebinars = () => {
    const payload = {
      page: 1,
      limit: 50,
      upcoming: true,
      title: '',
      my_webinars: true,
    };
    dispatch(getAllWebinar(payload))
      .unwrap()
      .then(response => {
        setWebinarData(response?.data?.data?.webinars || []);
      })
      .finally(() => setLoading(false));
  };

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
          console.log('Bank API error:', e?.response?.status);
          return null;
        }),
      ]);
      setWalletData(walletRes?.data?.data?.wallet || null);
      setBankAccount(bankRes?.data?.data?.bankAccount || null);
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

  const withdrawableBalance = walletData?.pending_settlement || 0;

  const milestones = useMemo(
    () => [
      { label: 'Create your account', pts: 10, completed: true },
      { label: 'Complete your profile', pts: 2, completed: true },
      {
        label: 'Publish your first course',
        pts: 30,
        completed: courses.length > 0,
      },
      {
        label: 'Go Live once',
        pts: 20,
        completed: webiniarData.length > 0,
      },
      {
        label: 'Get your first student',
        pts: 40,
        completed: !!creatorStats?.statistics?.total_enrollments,
      },
    ],
    [creatorStats, creatorWebinarStats],
  );

  const totalPts = milestones.reduce((sum, m) => sum + m.pts, 0);
  const earnedPts = milestones.reduce(
    (sum, m) => sum + (m.completed ? m.pts : 0),
    0,
  );
  const progressPercent = Math.round((earnedPts / totalPts) * 100);
  const circumference = 2 * Math.PI * wp(28);
  const progressOffset = circumference * (1 - progressPercent / 100);
  const allCompleted = milestones.every(m => m.completed);

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
              <Text style={styles.greetingSub}>{getGreeting()}</Text>
              <Text style={styles.greeting}>{displayName?.split(' ')[0]}</Text>
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
              onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
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
        {/* Total Revenue Card */}
        <View style={styles.sectionPadding}>
          <LinearGradient
            colors={['#1A1A2E', '#16213E', '#0F3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.revenueCard}
          >
            <View style={styles.revenueHeader}>
              <View>
                <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
                <Text style={styles.revenueAmount}>
                  <Text style={styles.rupeeSymbol}>₹</Text>
                  {walletLoading
                    ? '...'
                    : `${formatAmount(withdrawableBalance)}`}
                </Text>
              </View>
              <View style={styles.growingBadge}>
                <TrendingUp size={wp(14)} color={colors.white} />
                <Text style={styles.growingText}>Growing</Text>
              </View>
            </View>

            <View style={styles.revenueDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <BookOpen size={wp(16)} color={colors.white} />
                </View>
                <Text style={styles.statValue}>
                  {creatorStats?.statistics?.courses_sold ?? 0}
                </Text>
                <Text style={styles.statLabel}>Courses Sold</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <Users size={wp(16)} color={colors.white} />
                </View>
                <Text style={styles.statValue}>
                  {creatorStats?.statistics?.total_enrollments ?? 0}
                </Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <Award size={wp(16)} color={colors.white} />
                </View>
                <Text style={styles.statValue}>
                  {creatorWebinarStats?.statistics?.webinars_sold ?? 0}
                </Text>
                <Text style={styles.statLabel}>Webinars Sold</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Launch Your First Course Card */}
        <View style={styles.sectionPadding}>
          <LinearGradient
            colors={['#1A1A2E', '#16213E', '#0F3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.courseCard}
          >
            {/* Header */}
            <View style={styles.courseHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.startBadge}>
                  <Sparkles size={wp(12)} color={colors.secondary} />
                  <Text style={styles.startBadgeText}>START CREATING</Text>
                </View>
                <Text style={styles.courseTitle}>
                  Launch Your{'\n'}
                  {creatorStats?.statistics?.courses_sold
                    ? 'Next'
                    : 'First'}{' '}
                  Course
                </Text>
                <Text style={styles.courseSubtitle}>
                  Turn expertise into income.{'\n'}Ready in under 10 mins.
                </Text>
              </View>
              <Text style={styles.courseEmoji}>📚</Text>
            </View>

            {/* Horizontal Stepper with connected line */}
            <View style={styles.stepperWrap}>
              {/* Connecting line behind circles */}
              <View style={styles.stepperLine} />

              <View style={styles.stepsRow}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Lightbulb size={wp(16)} color={colors.white} />
                  </View>
                  <Text style={styles.stepTitle}>Pick Topic</Text>
                </View>

                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      { backgroundColor: colors.info },
                    ]}
                  >
                    <PenLine size={wp(16)} color={colors.white} />
                  </View>
                  <Text style={styles.stepTitle}>Add Content</Text>
                </View>

                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      { backgroundColor: colors.accent },
                    ]}
                  >
                    <Rocket size={wp(16)} color={colors.white} />
                  </View>
                  <Text style={styles.stepTitle}>Publish</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateCourse');
                } else {
                  navigation.navigate('KYCVerificationScreen');
                }
              }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Create Course Now</Text>
              <ChevronRight size={wp(18)} color={colors.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Go Live Card */}
        <View style={styles.sectionPadding}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (user?.kyc_verified) {
                navigation.navigate('CreateWebinar');
              } else {
                navigation.navigate('KYCVerificationScreen');
              }
            }}
          >
            <LinearGradient
              colors={['#1A1A2E', '#16213E', '#0F3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.liveCard}
            >
              <View style={styles.liveLeft}>
                <View style={styles.liveIconWrap}>
                  <Text style={{ fontSize: fp(24) }}>📡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.liveBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.liveBadgeText}>GO LIVE</Text>
                  </View>
                  <Text style={styles.liveTitle}>Start a Live Session</Text>
                  <Text style={styles.liveSubtitle}>
                    Connect with your audience in real time
                  </Text>
                </View>
              </View>
              <ChevronRight size={wp(20)} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Creator Score */}
        <View style={styles.sectionPadding}>
          {allCompleted ? (
            <LinearGradient
              colors={['#1A1A2E', '#16213E', '#0F3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreCard}
            >
              {/* Trophy */}
              <View style={styles.trophyWrap}>
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>

              {/* Title */}
              <Text style={styles.proTitle}>You're a Manchly Pro!</Text>

              {/* Description */}
              <Text style={styles.proDescription}>
                All starter tasks done. You've earned{' '}
                <Text style={styles.proPointsHighlight}>{earnedPts} pts</Text>{' '}
                and{'\n'}unlocked the{' '}
                <Text style={styles.proBadgeHighlight}>Rising Star </Text>
                <Star
                  size={wp(14)}
                  color={colors.golden}
                  fill={colors.golden}
                />{' '}
                badge.
              </Text>

              {/* Task Icons Row */}
              <View style={styles.taskIconsRow}>
                {['🎓', '📡', '💰', '👥', '✅'].map((emoji, index) => (
                  <View key={index} style={styles.taskIconBox}>
                    <Text style={styles.taskIconEmoji}>{emoji}</Text>
                  </View>
                ))}
              </View>

              {/* Keep Growing CTA */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('CreateProducts')}
                style={styles.keepGrowingBtn}
              >
                <Text style={styles.keepGrowingText}>
                  🚀 Keep Growing on Manchly →
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#1A1A2E', '#16213E', '#0F3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreCard}
            >
              {/* Score and Progress Ring */}
              <View style={styles.scoreTopRow}>
                <View>
                  <Text style={styles.scoreLabel}>CREATOR SCORE</Text>
                  <Text style={styles.scoreValue}>{earnedPts}</Text>
                </View>
                <View style={styles.progressRingWrap}>
                  <Svg width={wp(70)} height={wp(70)}>
                    <SvgCircle
                      cx={wp(35)}
                      cy={wp(35)}
                      r={wp(28)}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={wp(5)}
                      fill="none"
                    />
                    <SvgCircle
                      cx={wp(35)}
                      cy={wp(35)}
                      r={wp(28)}
                      stroke="#9B59B6"
                      strokeWidth={wp(5)}
                      fill="none"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${progressOffset}`}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${wp(35)}, ${wp(35)}`}
                    />
                  </Svg>
                  <View style={styles.progressRingText}>
                    <Text style={styles.progressPercent}>
                      {progressPercent}%
                    </Text>
                    <Text style={styles.progressDone}>done</Text>
                  </View>
                </View>
              </View>

              {/* Next Level */}
              <View style={styles.nextLevelRow}>
                <Text style={styles.nextLevelText}>Next: </Text>
                <Text style={styles.nextLevelName}>Rising Star </Text>
                <Star
                  size={wp(16)}
                  color={colors.golden}
                  fill={colors.golden}
                />
              </View>

              {/* Milestones */}
              <View style={styles.milestonesWrap}>
                {milestones.map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <View
                      style={[
                        styles.milestoneCheck,
                        milestone.completed && styles.milestoneCompleted,
                      ]}
                    >
                      {milestone.completed ? (
                        <Check
                          size={wp(14)}
                          color={colors.white}
                          strokeWidth={3}
                        />
                      ) : (
                        <Circle size={wp(14)} color="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.milestoneText,
                        milestone.completed && styles.milestoneTextCompleted,
                      ]}
                    >
                      {milestone.label}
                    </Text>
                    <View style={styles.milestonePts}>
                      <Text style={styles.milestonePtsText}>
                        +{milestone.pts} pts
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}
        </View>
      </ScrollView>

      {showIntroVideo ? (
        <View style={isFullScreen ? styles.fullScreenVideoContainer : styles.floatingVideoContainer}>
          <View style={isFullScreen ? styles.expandedVideoWrap : styles.miniVideoWrap}>
            <View style={styles.videoButtonsRow}>
              <TouchableOpacity
                style={styles.videoActionButton}
                onPress={() => setIsFullScreen(!isFullScreen)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Maximize2 size={wp(14)} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.videoActionButton}
                onPress={() => {
                  setShowIntroVideo(false);
                  setIsFullScreen(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={wp(16)} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Video
              source={{ uri: INTRO_VIDEO_URL }}
              style={styles.floatingVideo}
              resizeMode={isFullScreen ? 'contain' : 'cover'}
              paused={false}
              controls={false}
              muted={false}
              playWhenInactive={false}
              playInBackground={false}
              ignoreSilentSwitch="obey"
              onEnd={() => {
                setShowIntroVideo(false);
                setIsFullScreen(false);
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  headerWrapper: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.white,
  },
  greetingSub: {
    fontSize: fp(13),
    color: colors.muted,
    fontWeight: '500',
  },
  greeting: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
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

  // Revenue Card
  revenueCard: {
    borderRadius: wp(20),
    padding: wp(20),
    shadowColor: '#6C3CE1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(6),
  },
  revenueLabel: {
    fontSize: fp(12),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    marginBottom: hp(6),
  },
  growingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(20),
  },
  growingText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.white,
  },
  revenueAmount: {
    fontSize: fp(40),
    fontWeight: '800',
    color: colors.white,
  },
  rupeeSymbol: {
    fontSize: fp(22),
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: hp(16),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrap: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  statValue: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(3),
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: hp(50),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Course Card
  courseCard: {
    borderRadius: wp(20),
    padding: wp(20),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(22),
  },
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(5),
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: wp(20),
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    marginBottom: hp(12),
  },
  startBadgeText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 1,
  },
  courseTitle: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(30),
  },
  courseSubtitle: {
    fontSize: fp(13),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(19),
    marginTop: hp(8),
  },
  courseEmoji: {
    fontSize: fp(42),
    marginLeft: wp(8),
    marginTop: hp(10),
  },

  // Stepper
  stepperWrap: {
    position: 'relative',
    marginBottom: hp(22),
  },
  stepperLine: {
    position: 'absolute',
    top: wp(18),
    left: wp(18),
    right: wp(18),
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  stepTitle: {
    fontSize: fp(12),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: colors.white,
    borderRadius: wp(14),
    paddingVertical: hp(14),
  },
  ctaText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.primary,
  },

  // Go Live Card
  liveCard: {
    borderRadius: wp(18),
    padding: wp(18),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  liveLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  liveIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    marginBottom: hp(4),
  },
  greenDot: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(4),
    backgroundColor: colors.accent,
  },
  liveBadgeText: {
    fontSize: fp(11),
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  liveTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(2),
  },
  liveSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
  },

  // Creator Score
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  scoreHeaderTitle: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.primary,
  },
  scoreHeaderLink: {
    fontSize: fp(14),
    fontWeight: '600',
    color: '#9B59B6',
  },
  scoreCard: {
    borderRadius: wp(20),
    padding: wp(20),
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  scoreLabel: {
    fontSize: fp(16),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    marginBottom: hp(4),
  },
  scoreValue: {
    fontSize: fp(48),
    fontWeight: '800',
    color: '#9B59B6',
  },
  progressRingWrap: {
    width: wp(70),
    height: wp(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingText: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
  },
  progressDone: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  nextLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  nextLevelText: {
    fontSize: fp(15),
    color: colors.white,
    fontWeight: '500',
  },
  nextLevelName: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.secondary,
  },
  milestonesWrap: {
    gap: hp(10),
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: wp(14),
    paddingVertical: hp(14),
    paddingHorizontal: wp(14),
  },
  milestoneCheck: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  milestoneCompleted: {
    backgroundColor: colors.accent,
  },
  milestoneText: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.white,
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.5)',
  },
  milestonePts: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: wp(12),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
  },
  milestonePtsText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.golden,
  },

  // Manchly Pro Card (all completed)
  radialGlow: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    bottom: '30%',
    borderRadius: wp(100),
    backgroundColor: 'rgba(34, 139, 34, 0.15)',
  },
  trophyWrap: {
    alignItems: 'center',
    marginBottom: hp(16),
    marginTop: hp(8),
  },
  trophyEmoji: {
    fontSize: fp(64),
  },
  proTitle: {
    fontSize: fp(26),
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(12),
  },
  proDescription: {
    fontSize: fp(15),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: fp(22),
    marginBottom: hp(20),
  },
  proPointsHighlight: {
    fontWeight: '800',
    color: colors.golden,
  },
  proBadgeHighlight: {
    fontWeight: '800',
    color: colors.secondary,
  },
  taskIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(12),
    marginBottom: hp(22),
  },
  taskIconBox: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconEmoji: {
    fontSize: fp(24),
  },
  keepGrowingBtn: {
    backgroundColor: '#2ECC71',
    borderRadius: wp(16),
    paddingVertical: hp(16),
    alignItems: 'center',
  },
  keepGrowingText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.primary,
  },

  // Floating Intro Video
  floatingVideoContainer: {
    position: 'absolute',
    bottom: hp(16),
    right: wp(12),
    width: SCREEN_WIDTH * 0.35,
    aspectRatio: 9 / 16,
    borderRadius: wp(12),
    overflow: 'hidden',
    backgroundColor: colors.black,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fullScreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
  },
  expandedVideoWrap: {
    width: SCREEN_WIDTH * 0.75,
    aspectRatio: 9 / 16,
    borderRadius: wp(16),
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  miniVideoWrap: {
    width: '100%',
    height: '100%',
  },
  videoButtonsRow: {
    position: 'absolute',
    top: wp(8),
    right: wp(8),
    zIndex: 10,
    flexDirection: 'row',
    gap: wp(8),
  },
  videoActionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(14),
    padding: wp(6),
  },
  floatingVideo: {
    width: '100%',
    height: '100%',
  },
});
