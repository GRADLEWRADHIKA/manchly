import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { Menu, Bell, User, CheckCircle } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import StatsFilterBar from './components/StatsFilterBar';
import MetricCard from './components/MetricCard';
import LineChart from './components/LineChart';
import ListRow from './components/ListRow';

const SESSIONS_CHART_DATA = [1500, 3200, 2400, 5800, 4200, 8400, 12840];
const SESSIONS_CHART_LABELS = ['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'];

const ALL_SESSIONS = [
  {
    id: '1',
    name: 'Sarah Connor',
    meta: 'High Performance Coaching',
    time: 'Today, 2:30 PM',
    status: 'UPCOMING',
    isUpcoming: true,
    avatar: 'SC',
  },
  {
    id: '2',
    name: 'John Doe',
    meta: 'Career Development',
    time: 'Tomorrow, 10:00 AM',
    status: 'UPCOMING',
    isUpcoming: true,
    avatar: 'JD',
  },
  {
    id: '3',
    name: 'Alice Smith',
    meta: 'Leadership & Strategy',
    time: '28 Jun, 4:00 PM',
    status: 'COMPLETED',
    isUpcoming: false,
    avatar: 'AS',
  },
  {
    id: '4',
    name: 'Bob Miller',
    meta: 'Technical Architecture',
    time: '25 Jun, 11:30 AM',
    status: 'COMPLETED',
    isUpcoming: false,
    avatar: 'BM',
  },
];

const TOP_SESSIONS = [
  {
    id: '1',
    title: 'Advanced UI Masterclass',
    description: 'Deep dive into design systems and spatial UI principles',
    duration: '120 mins',
    tags: [
      { label: 'HIGH ENGAGEMENT', bg: 'rgba(34,197,94,0.12)', color: '#22C55E', bordered: false },
      { label: '95% RATING', bg: 'transparent', color: colors.textSecondary, bordered: true },
    ],
  },
  {
    id: '2',
    title: 'Strategic Career Growth',
    description: 'Navigating senior leadership roles in tech startups.',
    duration: '90 mins',
    tags: [
      { label: 'PREMIUM', bg: 'rgba(34,197,94,0.12)', color: '#22C55E', bordered: false },
      { label: '100% RATING', bg: 'transparent', color: colors.textSecondary, bordered: true },
    ],
  },
];

const WEBINARS_CHART_DATA = [2000, 5000, 8000, 6000, 9000, 12000, 14285];
const WEBINARS_CHART_LABELS = ['JAN', 'APR', 'JUN', 'NOW'];

const RECENT_WEBINARS = [
  { id: '1', title: 'Scaling Infrastructure', meta: '1.1M · 76% Engagement', status: 'LIVE', isLive: true, initials: 'SI' },
  { id: '2', title: 'AI Content Strategy', meta: '2,140 · 76% Responses', status: 'Recorded', isLive: false, initials: 'AI' },
  { id: '3', title: 'Digital Finance Future', meta: '2,110 · 80% Engagement', status: 'Recorded', isLive: false, initials: 'DF' },
];

const EXPERT_PERFORMERS = [
  { id: '1', name: 'Dr. Shreya Agrawal', meta: '14 Courses', revenue: '₹42,300', label: 'Ratings', initials: 'SA' },
  { id: '2', name: 'Milen Kumar', meta: '9 Courses', revenue: '₹38,700', label: 'Mentor', initials: 'MK' },
];

const COURSES_CHART_DATA = [4000, 8000, 15000, 12000, 18000, 22000, 28495];
const COURSES_CHART_LABELS = ['JAN', 'MAY', 'JUL', 'NOV'];

const TOP_COURSES = [
  { id: '1', title: 'Advanced Culinary Arts', enrollments: '13,468', completion: 84, initials: 'AC' },
  { id: '2', title: 'Digital Product Design', enrollments: '8,200', completion: 62, initials: 'DP' },
  { id: '3', title: 'Cinematic Photography', enrollments: '15,100', completion: 81, initials: 'CP' },
];

const DEMOGRAPHICS = [
  { range: '18-24', percent: 46 },
  { range: '25-34', percent: 32 },
  { range: '35+', percent: 33 },
];

const StatsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);
  const [activeTab, setActiveTab] = useState<'Courses' | 'Webinars' | 'Sessions'>('Sessions');
  const [sessionFilter, setSessionFilter] = useState<'All' | 'Upcoming'>('All');

  const radius = 22;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const successPercentage = 96;
  const strokeDashoffset = circumference - (successPercentage / 100) * circumference;

  const handleFilterPress = () => {
    Toast.show({
      type: 'info',
      text1: 'Time Range Filter',
      text2: 'Filter options sheet (Mocked)',
      position: 'top',
    });
  };

  const handleExportPress = () => {
    Toast.show({
      type: 'success',
      text1: 'Exporting Data',
      text2: 'PDF / CSV download started (Mocked)',
      position: 'top',
    });
  };

  const renderWebinarsVariant = () => (
    <View style={styles.variantContainer}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>PERFORMANCE DASHBOARD</Text>
        <Text style={styles.heading}>Webinar Insights</Text>
        <Text style={styles.subtext}>Configure and track your streamed content metrics.</Text>
      </View>

      <StatsFilterBar onFilterPress={handleFilterPress} onExportPress={handleExportPress} />

      {/* Hero Revenue Card */}
      <View style={styles.card}>
        <MetricCard
          label="WEBINAR REVENUE"
          value="₹1,42,850"
          changeText="+8.0%"
          changeType="up"
          valueSize="large"
          style={styles.heroMetricInner}
        />
        <LineChart data={WEBINARS_CHART_DATA} labels={WEBINARS_CHART_LABELS} height={hp(90)} />
      </View>

      {/* Side-by-side */}
      <View style={styles.sideBySideContainer}>
        <MetricCard
          label="STREAMING IMPACT"
          value="42,850"
          subLabel="Total Mins"
          style={styles.halfCard}
        />
        <View style={[styles.halfCard, styles.successRateCard]}>
          <View style={styles.successRateHeader}>
            <Text style={styles.successRateLabel}>DELIVERY</Text>
          </View>
          <Text style={[styles.heading, { fontSize: fp(28) }]}>124</Text>
          <Text style={[styles.subtext, { fontSize: fp(10), textAlign: 'center' }]}>
            80% Success Rate
          </Text>
        </View>
      </View>

      {/* Recent Webinars */}
      <View style={styles.card}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Recent Webinars</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.historyLinkText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {RECENT_WEBINARS.map((w, index) => (
          <ListRow
            key={w.id}
            title={w.title}
            meta={w.meta}
            avatarInitials={w.initials}
            trailingType="tag"
            trailingText={w.status}
            trailingTagBg={w.isLive ? colors.goldDim : 'rgba(255,255,255,0.05)'}
            trailingTagTextColor={w.isLive ? colors.gold : colors.textSecondary}
            showDivider={index < RECENT_WEBINARS.length - 1}
          />
        ))}
      </View>

      {/* Expert Performance */}
      <View style={styles.card}>
        <Text style={[styles.listTitle, { marginBottom: hp(12) }]}>Expert Performance</Text>
        {EXPERT_PERFORMERS.map((expert, index) => (
          <View key={expert.id}>
            <View style={styles.expertRow}>
              <View style={styles.expertAvatar}>
                <Text style={styles.expertAvatarText}>{expert.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expertName}>{expert.name}</Text>
                <Text style={styles.expertMeta}>{expert.meta}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.expertRevenue}>{expert.revenue}</Text>
                <Text style={styles.expertLabel}>{expert.label}</Text>
              </View>
            </View>
            {index < EXPERT_PERFORMERS.length - 1 && <View style={styles.dividerLine} />}
          </View>
        ))}
      </View>
    </View>
  );
  const renderCoursesVariant = () => (
    <View style={styles.variantContainer}>
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>PERFORMANCE DASHBOARD</Text>
        <Text style={styles.heading}>Course Performance</Text>
        <Text style={styles.subtext}>Review completions, enrollment count, and watch time.</Text>
      </View>

      <StatsFilterBar onFilterPress={handleFilterPress} onExportPress={handleExportPress} />

      {/* Lifetime Revenue */}
      <View style={styles.card}>
        <MetricCard
          label="Lifetime Revenue"
          value="₹2,84,950.00"
          changeText="+12.4% vs last this"
          changeType="up"
          valueSize="large"
          style={styles.heroMetricInner}
        />
        <LineChart data={COURSES_CHART_DATA} labels={COURSES_CHART_LABELS} height={hp(90)} />
      </View>

      {/* Engagement + Fulfillment */}
      <View style={styles.sideBySideContainer}>
        <MetricCard label="ENGAGEMENT" value="1.2M" changeText="+8%" changeType="up" style={styles.halfCard} />
        <MetricCard label="FULFILLMENT" value="1.1k" changeText="+57460" changeType="up" style={styles.halfCard} />
      </View>

      {/* Top Courses */}
      <View style={styles.card}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Top Courses</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.historyLinkText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {TOP_COURSES.map((course, index) => (
          <View key={course.id}>
            <View style={styles.courseRow}>
              <View style={styles.courseAvatar}>
                <Text style={styles.expertAvatarText}>{course.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expertName}>{course.title}</Text>
                <Text style={styles.expertMeta}>ENROLLMENTS: {course.enrollments}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${course.completion}%` }]} />
                </View>
              </View>
              <Text style={styles.completionText}>{course.completion}%{'\n'}COMP</Text>
            </View>
            {index < TOP_COURSES.length - 1 && <View style={styles.dividerLine} />}
          </View>
        ))}
      </View>

      {/* Demographics */}
      <View style={styles.card}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Demographics</Text>
        </View>
        {DEMOGRAPHICS.map(d => (
          <View key={d.range} style={styles.demoRow}>
            <Text style={styles.demoRange}>{d.range}</Text>
            <View style={styles.demoBarBg}>
              <View style={[styles.demoBarFill, { width: `${d.percent}%` }]} />
            </View>
            <Text style={styles.demoPercent}>{d.percent}%</Text>
          </View>
        ))}
        <View style={styles.regionRow}>
          <Text style={styles.expertMeta}>TOP REGION</Text>
          <Text style={styles.expertName}>PATNA</Text>
        </View>
      </View>
    </View>
  );
  const renderSessionsVariant = () => {
    const displayedSessions =
      sessionFilter === 'All'
        ? ALL_SESSIONS
        : ALL_SESSIONS.filter(s => s.isUpcoming);

    return (
      <View style={styles.variantContainer}>
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>PERFORMANCE DASHBOARD</Text>
          <Text style={styles.heading}>1:1 Session</Text>
          <Text style={styles.subtext}>Track coaching performance and revenue.</Text>
        </View>

        {/* Stats Filter Bar */}
        <StatsFilterBar onFilterPress={handleFilterPress} onExportPress={handleExportPress} />

        {/* Hero Metric Card */}
        <View style={styles.card}>
          <MetricCard
            label="COACHING REVENUE"
            value="₹12,840"
            changeText="+8.4%"
            changeType="up"
            valueSize="large"
            style={styles.heroMetricInner}
          />
          <LineChart data={SESSIONS_CHART_DATA} labels={SESSIONS_CHART_LABELS} height={hp(90)} />
        </View>

        {/* Side-by-Side Metric Cards */}
        <View style={styles.sideBySideContainer}>
          <MetricCard
            label="LIVE ENGAGEMENT"
            value="2,450"
            subLabel="Total Mins"
            style={styles.halfCard}
          />

          {/* Success Rate Circular Ring */}
          <View style={[styles.halfCard, styles.successRateCard]}>
            <View style={styles.successRateHeader}>
              <Text style={styles.successRateLabel}>SUCCESS RATE</Text>
            </View>
            <View style={styles.circleContainer}>
              <Svg width={60} height={60} viewBox="0 0 60 60">
                <Circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke={colors.border || '#2A2A2C'}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx="30"
                  cy="30"
                  r={radius}
                  stroke={colors.gold || '#F0C040'}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  transform="rotate(-90 30 30)"
                />
              </Svg>
              <View style={styles.circleTextContainer}>
                <Text style={styles.circleText}>{successPercentage}%</Text>
              </View>
              <View style={styles.overlappingAvatarContainer}>
                {user?.profile_image ? (
                  <Image source={{ uri: user.profile_image }} style={styles.overlappingAvatar} />
                ) : (
                  <View style={styles.overlappingAvatarFallback}>
                    <User size={10} color={colors.white || '#FFFFFF'} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Top Sessions Card */}
        <View style={styles.card}>
          <View style={styles.listHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(6) }}>
              <CheckCircle size={14} color={colors.gold} />
              <Text style={styles.listTitle}>Top Sessions</Text>
            </View>
            <Text style={styles.allTimeBest}>ALL-TIME BEST</Text>
          </View>

          {TOP_SESSIONS.map((session, index) => (
            <View key={session.id}>
              <View style={styles.topSessionRow}>
                <View style={styles.topSessionHeader}>
                  <Text style={styles.topSessionTitle}>{session.title}</Text>
                  <View style={styles.durationPill}>
                    <Text style={styles.durationPillText}>{session.duration}</Text>
                  </View>
                </View>
                <Text style={styles.topSessionDesc}>{session.description}</Text>
                <View style={styles.topSessionTags}>
                  {session.tags.map((tag, i) => (
                    <View
                      key={i}
                      style={[
                        styles.topSessionTag,
                        { backgroundColor: tag.bg },
                        tag.bordered && { borderWidth: 1, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.topSessionTagText, { color: tag.color }]}>
                        {tag.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              {index < TOP_SESSIONS.length - 1 && <View style={styles.dividerLine} />}
            </View>
          ))}
        </View>

        {/* Sessions List Card */}
        <View style={styles.card}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitle}>Sessions</Text>
            <View style={styles.listToggleContainer}>
              {(['All', 'Upcoming'] as const).map(option => {
                const isSelected = sessionFilter === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.listToggleOption,
                      isSelected && styles.listToggleOptionActive,
                    ]}
                    onPress={() => setSessionFilter(option)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.listToggleText,
                        isSelected && styles.listToggleTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {displayedSessions.map((session, index) => (
            <ListRow
              key={session.id}
              title={session.name}
              meta={session.meta}
              avatarInitials={session.avatar}
              trailingType="tag"
              trailingText={session.status}
              trailingTagBg={session.isUpcoming ? colors.goldDim : 'rgba(255,255,255,0.05)'}
              trailingTagTextColor={session.isUpcoming ? colors.gold : colors.textSecondary}
              showDivider={index < displayedSessions.length - 1}
            />
          ))}

          <TouchableOpacity
            style={styles.historyLink}
            activeOpacity={0.7}
            onPress={() => Toast.show({ type: 'info', text1: 'Full history coming soon!' })}
          >
            <Text style={styles.historyLinkText}>View Entire History</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('CreatorSetting')}
        >
          <Menu size={22} color={colors.white || '#FFFFFF'} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Manchly</Text>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('CreatorNotification')}
        >
          <Bell size={22} color={colors.white || '#FFFFFF'} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRowContainer}>
        <View style={styles.tabRow}>
          {(['Courses', 'Webinars', 'Sessions'] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabSegment,
                  isActive ? styles.tabSegmentActive : styles.tabSegmentInactive,
                ]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'Sessions' && renderSessionsVariant()}
        {activeTab === 'Webinars' && renderWebinarsVariant()}
        {activeTab === 'Courses' && renderCoursesVariant()}
      </ScrollView>
    </View>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#0F0F0F',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp(40),
  },

  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    backgroundColor: colors.bg || '#0F0F0F',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || '#2A2A2C',
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
    backgroundColor: colors.gold || '#F0C040',
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.gold || '#F0C040',
    letterSpacing: 0.5,
  },

  // Tab Segmented Control
  tabRowContainer: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg || '#242426',
    borderRadius: 10,
    padding: 4,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: hp(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabSegmentActive: {
    backgroundColor: colors.gold || '#F0C040',
  },
  tabSegmentInactive: {
    backgroundColor: colors.surface || '#1C1C1E',
    marginHorizontal: 1,
  },
  tabText: {
    fontSize: fp(13),
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: colors.textSecondary || '#888888',
    fontWeight: '500',
  },

  // Variant Container
  variantContainer: {
    paddingHorizontal: wp(16),
  },

  // Header Block
  headerBlock: {
    marginBottom: hp(16),
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold || '#F0C040',
    letterSpacing: 0.8,
    marginBottom: hp(4),
  },
  heading: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
    marginBottom: hp(4),
  },
  subtext: {
    fontSize: fp(12),
    color: colors.textSecondary || '#888888',
  },

  // Card
  card: {
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
    marginBottom: hp(12),
  },
  heroMetricInner: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
  },

  // Side-by-side
  sideBySideContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  halfCard: {
    width: '48.5%',
    backgroundColor: colors.surface || '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border || '#2A2A2C',
  },

  // Circular Ring
  successRateCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRateHeader: {
    width: '100%',
    marginBottom: hp(6),
  },
  successRateLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.textMuted || '#555558',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  circleContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: hp(4),
  },
  circleTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
  },
  overlappingAvatarContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.surface || '#1C1C1E',
    overflow: 'hidden',
  },
  overlappingAvatar: {
    width: '100%',
    height: '100%',
  },
  overlappingAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gold || '#F0C040',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List Header
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  listTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
  },

  // Toggle
  listToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg || '#242426',
    borderRadius: 14,
    padding: 2.5,
  },
  listToggleOption: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: 12,
  },
  listToggleOptionActive: {
    backgroundColor: colors.surface || '#1C1C1E',
  },
  listToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary || '#888888',
  },
  listToggleTextActive: {
    color: colors.white || '#FFFFFF',
  },

  // History Link
  historyLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    marginTop: hp(8),
  },
  historyLinkText: {
    color: colors.gold || '#F0C040',
    fontSize: fp(12),
    fontWeight: '600',
  },

  // Top Sessions
  allTimeBest: {
    fontSize: fp(9),
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  topSessionRow: {
    paddingVertical: hp(10),
  },
  topSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  topSessionTitle: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
    flex: 1,
  },
  topSessionDesc: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginBottom: hp(8),
    lineHeight: fp(16),
  },
  topSessionTags: {
    flexDirection: 'row',
    gap: wp(6),
  },
  topSessionTag: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: 6,
  },
  topSessionTagText: {
    fontSize: fp(9),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  durationPill: {
    backgroundColor: colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    marginLeft: wp(8),
  },
  durationPillText: {
    fontSize: fp(10),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: hp(2),
  },

  // Expert Performers
  expertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingVertical: hp(10),
  },
  expertAvatar: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertAvatarText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expertName: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expertMeta: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  expertRevenue: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.gold,
  },
  expertLabel: {
    fontSize: fp(10),
    color: colors.textMuted,
    marginTop: hp(2),
  },

  // Top Courses
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingVertical: hp(10),
  },
  courseAvatar: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(8),
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: hp(4),
    borderRadius: 4,
    backgroundColor: colors.border,
    marginTop: hp(6),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  completionText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: fp(14),
  },

  // Demographics
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginBottom: hp(10),
  },
  demoRange: {
    fontSize: fp(11),
    color: colors.textSecondary,
    width: wp(36),
  },
  demoBarBg: {
    flex: 1,
    height: hp(5),
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  demoBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  demoPercent: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.textSecondary,
    width: wp(30),
    textAlign: 'right',
  },
  regionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(8),
    paddingTop: hp(10),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});