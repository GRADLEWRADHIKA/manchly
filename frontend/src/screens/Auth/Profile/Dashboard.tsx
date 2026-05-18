import React, {useState, useEffect, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Trophy} from 'lucide-react-native';
import colors from '../../../utils/colors';
import {wp, hp, fp} from '../../../utils/responsive';
import {getDashboardStats} from '../../../store/SessionSlice';

const CARD_BG = '#f8faf9';
const CARD_BORDER = colors.borderLight;
const MUTED = colors.textMuted;
const BLUE = colors.info;
const GOLDEN = colors.golden;

const TABS = ['Course', 'Webinar', '1:1 Session'] as const;
type Tab = (typeof TABS)[number];

const fmt = (n: number) => {
  const val = Math.round(n * 100) / 100;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val}`;
};

const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const {dashboard} = useSelector((state: any) => state.sessionReducer);
  const [activeTab, setActiveTab] = useState<Tab>('1:1 Session');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      dispatch(getDashboardStats()).finally(() => setLoading(false));
    }
  }, [isFocused]);

  const totalRevenue = dashboard ? fmt(dashboard.total_revenue) : '₹0';
  const totalEnrolled = dashboard?.total_enrolled || 0;
  const totalProducts = dashboard?.total_products || 0;

  const getTabData = () => {
    if (!dashboard) return {enrolled: 0, revenue: '₹0'};
    switch (activeTab) {
      case 'Course':
        return {
          enrolled: dashboard.course?.enrolled || 0,
          revenue: fmt(dashboard.course?.revenue || 0),
        };
      case 'Webinar':
        return {
          enrolled: dashboard.webinar?.enrolled || 0,
          revenue: fmt(dashboard.webinar?.revenue || 0),
        };
      case '1:1 Session':
        return {
          enrolled: dashboard.session?.enrolled || 0,
          revenue: fmt(dashboard.session?.revenue || 0),
        };
    }
  };

  const data = getTabData();

  return (
    <View style={styles.container}>
      {/* Black Header */}
      <View style={[styles.headerArea, {paddingTop: insets.top + hp(10)}]}>
        <Text style={styles.brand}>MANCHLY</Text>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Full performance bifurcation</Text>

        <View style={styles.overviewCard}>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>ALL REVENUE</Text>
            <Text style={styles.overviewValueBlue} numberOfLines={1} adjustsFontSizeToFit>{totalRevenue}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>ALL ENROLLED</Text>
            <Text style={styles.overviewValue}>{totalEnrolled}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>PRODUCTS</Text>
            <Text style={styles.overviewValue}>{totalProducts}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: insets.bottom + hp(30)},
          ]}>
          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              const emoji =
                tab === 'Course' ? '📚' : tab === 'Webinar' ? '🎥' : '🤝';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}>
                  <Text style={styles.tabEmoji}>{emoji}</Text>
                  <Text
                    style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ENROLLED</Text>
              <Text style={styles.statValueDark}>{data.enrolled}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>REVENUE</Text>
              <Text style={styles.statValueBlue} numberOfLines={1} adjustsFontSizeToFit>{data.revenue}</Text>
            </View>
          </View>

          {/* Session-specific minutes */}
          {activeTab === '1:1 Session' && dashboard?.session && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>SESSION DETAILS</Text>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownName}>Total Minutes</Text>
                  <Text style={styles.breakdownPrice}>
                    {dashboard.session.minutes} min
                  </Text>
                </View>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownName}>Completed Sessions</Text>
                  <Text style={styles.breakdownPrice}>
                    {dashboard.session.count}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Overview Cards */}
          <View style={styles.sectionCard}>
            <View style={styles.leaderboardHeader}>
              <Trophy size={wp(16)} color={GOLDEN} strokeWidth={2} />
              <Text style={styles.sectionTitle}>PRODUCT OVERVIEW</Text>
            </View>
            <View style={styles.leaderRow}>
              <View style={[styles.rankBadge, {backgroundColor: BLUE}]}>
                <Text style={styles.rankText}>📚</Text>
              </View>
              <Text style={styles.leaderName}>Courses</Text>
              <Text style={styles.leaderRevenue}>
                {fmt(dashboard?.course?.revenue || 0)}
              </Text>
            </View>
            <View style={styles.leaderRow}>
              <View style={[styles.rankBadge, {backgroundColor: BLUE}]}>
                <Text style={styles.rankText}>🎥</Text>
              </View>
              <Text style={styles.leaderName}>Webinars</Text>
              <Text style={styles.leaderRevenue}>
                {fmt(dashboard?.webinar?.revenue || 0)}
              </Text>
            </View>
            <View style={styles.leaderRow}>
              <View style={[styles.rankBadge, {backgroundColor: BLUE}]}>
                <Text style={styles.rankText}>🤝</Text>
              </View>
              <Text style={styles.leaderName}>1:1 Sessions</Text>
              <Text style={styles.leaderRevenue}>
                {fmt(dashboard?.session?.revenue || 0)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default memo(Dashboard);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerArea: {
    backgroundColor: '#111111',
    paddingHorizontal: wp(18),
    paddingBottom: hp(18),
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
  },
  scrollContent: {
    paddingHorizontal: wp(18),
    paddingTop: hp(16),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: fp(11),
    fontWeight: '600',
    color: '#999999',
    letterSpacing: 2,
  },
  title: {
    fontSize: fp(28),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(4),
  },
  subtitle: {
    fontSize: fp(13),
    color: '#999999',
    marginTop: hp(2),
    marginBottom: hp(18),
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingVertical: hp(18),
    paddingHorizontal: wp(10),
  },
  overviewCol: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
  },
  overviewLabel: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1,
    marginBottom: hp(6),
  },
  overviewValueBlue: {
    fontSize: fp(20),
    fontWeight: '800',
    color: BLUE,
  },
  overviewValue: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: wp(14),
    padding: wp(4),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    borderRadius: wp(12),
    gap: wp(4),
  },
  tabActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabEmoji: {
    fontSize: fp(13),
  },
  tabText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: BLUE + '25',
  },
  statLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: BLUE,
    letterSpacing: 1,
    marginBottom: hp(6),
  },
  statValueDark: {
    fontSize: fp(28),
    fontWeight: '800',
    color: colors.text,
  },
  statValueBlue: {
    fontSize: fp(28),
    fontWeight: '800',
    color: BLUE,
  },
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  sectionTitle: {
    fontSize: fp(10),
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 1.5,
    marginBottom: hp(14),
  },
  breakdownItem: {
    gap: hp(10),
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  breakdownPrice: {
    fontSize: fp(14),
    fontWeight: '700',
    color: BLUE,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginBottom: hp(4),
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  rankBadge: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  rankText: {
    fontSize: fp(13),
  },
  leaderName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  leaderRevenue: {
    fontSize: fp(14),
    fontWeight: '700',
    color: BLUE,
  },
});
