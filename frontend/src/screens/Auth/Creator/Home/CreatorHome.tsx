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
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {
  Menu,
  Bell,
  Plus,
  Calendar,
  ChevronRight,
  Rocket,
  Zap,
  BarChart2,
  Upload,
  Play,
  Sparkles,
  HelpCircle,
  Star,
  Check,
  Circle,
  BookOpen,
  Users,
  Award,
  Shield,
  X,
  Maximize2,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
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
import { wp, hp, fp } from '../../../../utils/responsive';
import colors from '../../../../utils/colors';
import KycCard from './KeyCard';

const INTRO_VIDEO_URL =
  'https://stream.mux.com/aiFSECiPT501KG02eutUYBTKc8aPPOz27ikxTnTHaKJJ00.m3u8';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector(
    (state: any) => state.webinarReducer,
  );
  const insets = useSafeAreaInsets();
  const focus = useIsFocused();

  const [walletLoading, setWalletLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const walletRes = await instance
        .get('settlements/wallet')
        .catch(() => null);
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
  }, [focus]);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const totalRevenueAmount = walletData?.total_net_earnings || 0;

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Top Bar with Profile */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('CreatorSetting')}
          >
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarText}>
                  {(user?.name || 'C').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingSmall}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.75}
            onPress={() => {
              if (user?.kyc_verified) {
                navigation.navigate('CreateCourse');
              } else {
                navigation.navigate('KYCVerificationScreen');
              }
            }}
          >
            <Plus size={16} color={colors.bg} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('CreatorNotification')}
          >
            <Bell size={22} color={colors.textPrimary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* KYC Banner (compact) */}
        {!user?.kyc_verified && (
          <TouchableOpacity
            style={styles.kycBanner}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('KYCVerificationScreen')}
          >
            <Shield size={wp(18)} color={colors.gold} />
            <Text style={styles.kycBannerText}>Complete KYC to unlock withdrawals</Text>
            <ChevronRight size={wp(16)} color={colors.gold} />
          </TouchableOpacity>
        )}

        {/* Revenue Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>REVENUE OVERVIEW</Text>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueText}>
                  ₹{walletLoading ? '...' : formatAmount(totalRevenueAmount)}
                </Text>
                <View style={styles.greenPill}>
                  <Text style={styles.greenPillText}>+8.4% ↗</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.calendarButton}
              activeOpacity={0.75}
            >
              <Calendar size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Svg line chart mockup */}
          <View style={styles.chartContainer}>
            <Svg height={hp(60)} width="100%">
              <Path
                d="M 10 50 Q 80 10, 160 40 T 320 15"
                fill="none"
                stroke={colors.gold}
                strokeWidth={3}
              />
            </Svg>
            <View style={styles.chartXLabels}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.chartLabelText}>
                  {day}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Launch Course Checklist Card */}
        <View style={styles.card}>
          <View style={styles.launchRow}>
            <View style={styles.launchLeft}>
              <Text style={styles.launchHeading}>Launch Your Course</Text>
              <Text style={styles.launchStatus}>
                You're 75% ready to go live with "Mastering the Art".
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '75%' }]} />
                </View>
                <Text style={styles.progressPercent}>75%</Text>
              </View>
              <TouchableOpacity
                style={styles.outlinedGoldButton}
                activeOpacity={0.75}
                onPress={() => {
                  if (!user?.kyc_verified) {
                    navigation.navigate('KYCVerificationScreen');
                  } else {
                    navigation.navigate('CreateCourse');
                  }
                }}
              >
                <Text style={styles.outlinedGoldButtonText}>
                  Complete Checklist →
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.launchRight}>
              <View style={styles.rocketCircle}>
                <Rocket size={42} color={colors.gold} />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions — 4-column Grid */}
        <View style={styles.gridContainer}>
          {[
            {
              label: 'Webinar',
              icon: Zap,
              action: () => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateWebinar');
                } else {
                  navigation.navigate('KYCVerificationScreen');
                }
              },
            },
            {
              label: 'Sessions',
              icon: BookOpen,
              action: () => navigation.navigate('CreatorWebinar'),
            },
            {
              label: 'Courses',
              icon: BarChart2,
              action: () => navigation.navigate('ProductsScreen'),
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.gridCell}
              activeOpacity={0.75}
              onPress={item.action}
            >
              <View style={styles.gridIconTray}>
                <item.icon size={20} color={colors.gold} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Performing Content */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Top Performing Content</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ProductsScreen')}
          >
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.performingCard}>
          {[
            {
              title: 'Intro To Lighting',
              category: 'Premium Course',
              revenue: '₹2,104',
              image:
                'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=120&q=80',
            },
            {
              title: 'Options Strategy Bootcamp',
              category: 'Live Webinar',
              revenue: '₹2,10,000',
              image:
                'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=120&q=80',
            },
            {
              title: 'Passive Income Blueprints',
              category: 'Video Bundle',
              revenue: '₹95,000',
              image:
                'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=120&q=80',
            },
          ].map((item, index) => (
            <View
              key={index}
              style={[styles.contentRow, index > 0 && styles.rowDivider]}
            >
              <Image source={{ uri: item.image }} style={styles.thumbnail} />
              <View style={styles.contentMeta}>
                <Text style={styles.contentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.contentCategory}>{item.category}</Text>
              </View>
              <Text style={styles.contentRevenue}>{item.revenue}</Text>
            </View>
          ))}
        </View>

        {/* AI Content Assistant Card */}
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>✦ AI CONTENT ASSISTANT</Text>
          <Text style={styles.aiHeading}>Suggested: Host a Live Q&A</Text>
          <Text style={styles.aiDescription}>
          Based on your recent engagement spikes on Thursday evenings, a live session could increase your retention by up to 16%. Your subscribers are asking about "Color Grading Workflow"
          </Text>
          <View style={styles.aiActionsRow}>
            <TouchableOpacity
              style={styles.aiScheduleButton}
              activeOpacity={0.75}
              onPress={() => {
                if (user?.kyc_verified) {
                  navigation.navigate('CreateWebinar');
                } else {
                  navigation.navigate('KYCVerificationScreen');
                }
              }}
            >
              <Text style={styles.aiScheduleText}>Schedule Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiDraftButton}
              activeOpacity={0.75}
              onPress={() =>
                Toast.show({
                  type: 'success',
                  text1: 'Saved draft to templates!',
                })
              }
            >
              <Text style={styles.aiDraftText}>Draft Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Intro Video Overlay if active */}
      {showIntroVideo ? (
        <View
          style={
            isFullScreen
              ? styles.fullScreenVideoContainer
              : styles.floatingVideoContainer
          }
        >
          <View
            style={
              isFullScreen ? styles.expandedVideoWrap : styles.miniVideoWrap
            }
          >
            <View style={styles.videoButtonsRow}>
              <TouchableOpacity
                style={styles.videoActionButton}
                onPress={() => setIsFullScreen(!isFullScreen)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Maximize2 size={wp(14)} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.videoActionButton}
                onPress={() => {
                  setShowIntroVideo(false);
                  setIsFullScreen(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={wp(16)} color={colors.textPrimary} />
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
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingBottom: hp(110),
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  headerAvatar: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    borderWidth: 1.5,
    borderColor: colors.gold + '40',
  },
  headerAvatarFallback: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    backgroundColor: colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold + '40',
  },
  headerAvatarText: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.gold,
  },
  greetingSmall: {
    fontSize: fp(11),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: hp(1),
  },
  createBtn: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(10),
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: wp(6),
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp(6),
    right: wp(6),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.gold,
  },

  // KYC Banner (compact)
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: colors.gold + '12',
    borderWidth: 1,
    borderColor: colors.gold + '30',
    borderRadius: 10,
    paddingHorizontal: wp(14),
    paddingVertical: hp(10),
    marginBottom: hp(14),
    marginTop: hp(4),
  },
  kycBannerText: {
    flex: 1,
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.gold,
  },

  // Cards General
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: wp(16),
    marginBottom: hp(16),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(12),
  },
  cardLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginTop: hp(4),
  },
  revenueText: {
    fontSize: fp(26),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  greenPill: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: 99,
    backgroundColor: '#10B98118',
    borderWidth: 0.5,
    borderColor: '#10B981',
  },
  greenPillText: {
    color: '#10B981',
    fontSize: fp(10),
    fontWeight: '700',
  },
  calendarButton: {
    padding: wp(6),
    borderRadius: 8,
    backgroundColor: colors.inputBg,
  },

  // Mock Line Chart
  chartContainer: {
    marginTop: hp(10),
  },
  chartXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(10),
    marginTop: hp(8),
  },
  chartLabelText: {
    fontSize: fp(11),
    color: colors.textSecondary,
  },

  // Launch Checklist Card
  launchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  launchLeft: {
    flex: 1,
    paddingRight: wp(12),
  },
  launchHeading: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: hp(4),
  },
  launchStatus: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginBottom: hp(12),
    lineHeight: fp(17),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginBottom: hp(16),
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.gold,
  },
  progressPercent: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.gold,
  },
  outlinedGoldButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 99,
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedGoldButtonText: {
    color: colors.gold,
    fontSize: fp(13),
    fontWeight: '700',
  },
  launchRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rocketCircle: {
    width: wp(68),
    height: wp(68),
    borderRadius: 99,
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Actions 4-column Grid
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(8),
    marginBottom: hp(18),
  },
  gridCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: hp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconTray: {
    width: wp(40),
    height: wp(40),
    borderRadius: 99,
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(8),
  },
  gridLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Performing Content List
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(6),
    marginBottom: hp(12),
  },
  sectionHeading: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: fp(13),
    color: colors.gold,
    fontWeight: '500',
  },
  performingCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: wp(16),
    marginBottom: hp(16),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
  },
  rowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  thumbnail: {
    width: wp(40),
    height: wp(40),
    borderRadius: 8,
  },
  contentMeta: {
    flex: 1,
    marginLeft: wp(12),
    paddingRight: wp(8),
  },
  contentTitle: {
    fontSize: fp(13.5),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  contentCategory: {
    fontSize: fp(11.5),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  contentRevenue: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: colors.gold,
  },

  // AI Assistant Card
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(240, 192, 64, 0.3)', // gold at 30% opacity
    padding: wp(16),
    marginBottom: hp(24),
  },
  aiLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.5,
    marginBottom: hp(8),
  },
  aiHeading: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  aiDescription: {
    fontSize: fp(13),
    color: colors.textSecondary,
    lineHeight: fp(18),
    marginBottom: hp(16),
  },
  aiActionsRow: {
    flexDirection: 'row',
    gap: wp(10),
  },
  aiScheduleButton: {
    flex: 1.2,
    height: hp(42),
    backgroundColor: colors.gold,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiScheduleText: {
    color: '#000000',
    fontSize: fp(13),
    fontWeight: '700',
  },
  aiDraftButton: {
    flex: 1,
    height: hp(42),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDraftText: {
    color: colors.textPrimary,
    fontSize: fp(13),
    fontWeight: '500',
  },

  // Video Overlay
  floatingVideoContainer: {
    position: 'absolute',
    bottom: hp(90),
    right: wp(16),
    width: wp(150),
    height: hp(220),
    borderRadius: wp(12),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.black,
    zIndex: 9999,
    elevation: 10,
  },
  fullScreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.black,
    zIndex: 9999,
  },
  miniVideoWrap: {
    flex: 1,
    position: 'relative',
  },
  expandedVideoWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoButtonsRow: {
    position: 'absolute',
    top: hp(8),
    right: wp(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    zIndex: 10,
  },
  videoActionButton: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingVideo: {
    width: '100%',
    height: '100%',
  },
});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
