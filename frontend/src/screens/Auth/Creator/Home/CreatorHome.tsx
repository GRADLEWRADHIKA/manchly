import React, { useCallback, useEffect, useState } from 'react';
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
  //Sparkles,
  //Bot,
  BookOpen,
  Users,
  //Award,
  Calendar,
  AtSign,
  Video as VideoIcon,
  Phone,
} from 'lucide-react-native';
import Svg, { Circle as SvgCircle, Path as SvgPath } from 'react-native-svg';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import KycCard from './KeyCard';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
//import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import RocketIcon from '../../../../components/RocketIcon';
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
      .catch(error => {
        console.log('Error fetching webinars:', error);
      });
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

  const withdrawableBalance = walletData?.available_balance || 0;
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
              onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
            >
              <AtSign size={wp(20)} color={colors.white} />
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
              <Text style={styles.perfValue}>{courses.length}</Text>
            </View>
            <View style={styles.perfRow}>
              <Users size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Students</Text>
              <Text style={styles.perfValue}>
                {creatorStats?.statistics?.total_enrollments ?? 0}
              </Text>
            </View>
            <View style={styles.perfRow}>
              <VideoIcon size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Webinars</Text>
              <Text style={styles.perfValue}>{webiniarData.length}</Text>
            </View>
            <View style={styles.perfRow}>
              <Calendar size={wp(13)} color={colors.golden} />
              <Text style={styles.perfLabel}>Sessions</Text>
              <Text style={styles.perfValue}>
                {creatorWebinarStats?.statistics?.webinars_sold ?? 0}
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
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>Get</Text>
                <ChevronRight size={wp(18)} color={colors.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.quickActionCard}
              onPress={() => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateWebinar');
                } else {
                  navigation.navigate('KYCVerificationScreen');
                }
              }}
            >
              <View style={styles.quickActionIconWrap}>
                <VideoIcon size={wp(20)} color="#F2E4BC" />
              </View>
              <Text style={styles.quickActionText}>Go live</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.quickActionCard}
              onPress={() =>
                navigation.navigate('ProductsScreen', { initialTab: 'Sessions' })
              }
            >
              <View style={styles.quickActionIconWrap}>
                <Phone size={wp(20)} color="#F2E4BC" />
              </View>
              <Text style={styles.quickActionText}>1:1 Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
 
  {/*
<View style={styles.sectionPadding}>
  <LinearGradient
    colors={['#1A1A1A', '#141414']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.aiCard}
  >
    <View style={styles.aiBadge}>
      <Bot size={wp(14)} color={colors.golden} />
      <Text style={styles.aiBadgeText}>AI CONTENT ASSISTANT</Text>
    </View>

    <Text style={styles.aiTitle}>Suggested: Host a Live Q&A</Text>

    <Text style={styles.aiDescription}>
      Based on your recent engagement spikes on Thursday evenings, a
      live session could increase your retention by up to 15%. Your
      subscribers are asking about "Color Grading Workflow".
    </Text>
  </LinearGradient>
</View>
*/}
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

  // CTA (shared golden button style)
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

  // Quick Actions
  sectionTitle: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(12),
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: wp(12),
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: wp(16),
    paddingVertical: hp(18),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickActionIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(214,156,64,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  quickActionText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: '#D5C4AB',
  },

  // AI Content Assistant
  aiCard: {
    borderRadius: wp(20),
    padding: wp(20),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(6),
    marginBottom: hp(12),
  },
  aiBadgeText: {
    fontSize: fp(11),
    fontWeight: '800',
    color: colors.golden,
    letterSpacing: 1,
  },
  aiTitle: {
    fontSize: fp(17),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(8),
  },
  aiDescription: {
    fontSize: fp(12.5),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: fp(18),
    marginBottom: hp(18),
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  aiScheduleWrap: {
    flex: 1,
  },
  aiScheduleBtn: {
    borderRadius: wp(12),
    paddingVertical: hp(13),
    alignItems: 'center',
  },
  aiScheduleText: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: colors.primary,
  },
  aiDraftBtn: {
    flex: 1,
    borderRadius: wp(12),
    paddingVertical: hp(13),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(214,156,64,0.5)',
  },
  aiDraftText: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: '#D69C40',
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