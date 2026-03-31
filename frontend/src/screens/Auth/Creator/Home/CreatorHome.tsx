import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import KycCard from './KeyCard';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { getCreatorSales } from '../../../../store/PaymentSlice';
import { getCreatorCourseStats } from '../../../../store/CourseSlice';
import { getCreatorWebinarStats } from '../../../../store/WebinarSlice';

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const { totalRevenue } = useSelector((state: any) => state.paymentReducer);
  const { creatorStats } = useSelector((state: any) => state.coursesReducer);
  const { creatorWebinarStats } = useSelector((state: any) => state.webinarReducer);
  const insets = useSafeAreaInsets();

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
              <Text style={styles.greeting}>{displayName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('CreatorNotification')}
          >
            <Bell size={wp(20)} color={colors.white} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
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
                  {totalRevenue?.toLocaleString('en-IN') ?? '0'}
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
                <Text style={styles.statValue}>{creatorStats?.total_courses ?? 0}</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <Users size={wp(16)} color={colors.white} />
                </View>
                <Text style={styles.statValue}>{creatorStats?.total_enrollments ?? 0}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <Award size={wp(16)} color={colors.white} />
                </View>
                <Text style={styles.statValue}>{creatorWebinarStats?.total_webinars ?? 0}</Text>
                <Text style={styles.statLabel}>Webinars</Text>
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
                  Launch Your{'\n'}First Course
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
      </ScrollView>
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
});
