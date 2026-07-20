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
import {BookOpen, Users, Video} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import colors from '../../../utils/colors';
import {wp, hp, fp} from '../../../utils/responsive';
import {getDashboardStats} from '../../../store/SessionSlice';

// Figma palette — gold gradient border #F8DEAE → #D69C3F, glow #FFDCA1
const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const GOLD_GLOW = '#FFDCA1';
const CARD_BG = '#1A1A1A';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const LABEL_TAN = 'rgba(248,222,174,0.78)';

const TABS = ['Course', '1:1 Session', 'Webinar'] as const;
type Tab = (typeof TABS)[number];

const STEP_META: Record<Tab, {label: string; Icon: any}> = {
  Course: {label: 'COURSE', Icon: BookOpen},
  '1:1 Session': {label: '1:1 SESSION', Icon: Users},
  Webinar: {label: 'WEBINAR', Icon: Video},
};


// Decorative rising curve for the hero card (no axes — pure styling)
const CHART_LINE =
  'M0,40 C10,39.5 16,36 24,29 C32,22 38,16 46,14.5 C54,13 60,15 68,15.5 C76,16 82,16.5 88,14 C93,12 96,10 100,3';
const CHART_AREA = `${CHART_LINE} L100,44 L0,44 Z`;

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
      {/* Centered Header */}
      <View style={[styles.headerArea, {paddingTop: insets.top + hp(14)}]}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Stepper Selector */}
      <View style={styles.stepperRow}>
        {TABS.map((tab, i) => {
          const isActive = activeTab === tab;
          const {label, Icon} = STEP_META[tab];
          return (
            <React.Fragment key={tab}>
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}>
                {isActive ? (
                  <LinearGradient
                    colors={[GOLD_CREAM, GOLD_DEEP]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.stepRingActive}>
                    <View style={styles.stepCircleActive}>
                      <Icon size={wp(16)} color={'#F0C040'} strokeWidth={2} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.stepCircle}>
                    <Icon
                      size={wp(16)}
                      color={'rgba(240,192,64,0.5)'}
                      strokeWidth={2}
                    />
                  </View>
                )}
                <Text
                  style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
              {i < TABS.length - 1 && <View style={styles.stepLine} />}
            </React.Fragment>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={GOLD_DEEP} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: insets.bottom + hp(30)},
          ]}>
          {/* Hero Card — per selected product type */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>TOTAL STUDENTS ENROLLED</Text>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText} numberOfLines={1}>
                  {data.revenue}
                </Text>
              </View>
            </View>
            <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
              {data.enrolled.toLocaleString('en-IN')}
            </Text>

            <Svg
              width="100%"
              height={hp(104)}
              viewBox="0 0 100 44"
              preserveAspectRatio="none"
              style={styles.heroChart}>
              <Defs>
                <SvgLinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={GOLD_DEEP} stopOpacity="0.30" />
                  <Stop offset="1" stopColor={GOLD_DEEP} stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <Path d={CHART_AREA} fill="url(#chartFill)" />
              <Path
                d={CHART_LINE}
                stroke={GOLD_DEEP}
                strokeWidth={1.8}
                strokeLinecap="round"
                fill="none"
                vectorEffect="nonScalingStroke"
              />
            </Svg>
          </View>

          {/* All-time summary cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALL REVENUE</Text>
              <Text
                style={styles.statValueAccent}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {totalRevenue}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ALL ENROLLED</Text>
              <Text style={styles.statValueLight} numberOfLines={1}>
                {totalEnrolled}
              </Text>
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

          {/* Product Overview */}
          <View style={styles.overviewHeaderRow}>
            <Text style={styles.overviewHeading}>PRODUCT OVERVIEW</Text>
            <Text style={styles.overviewHeadingRight}>
              {totalProducts} Products
            </Text>
          </View>
          <View style={styles.listCard}>
            {(
              [
                {name: 'Courses', Icon: BookOpen, revenue: dashboard?.course?.revenue},
                {name: 'Webinars', Icon: Video, revenue: dashboard?.webinar?.revenue},
                {name: '1:1 Sessions', Icon: Users, revenue: dashboard?.session?.revenue},
              ] as const
            ).map((row, index) => (
              <View
                key={row.name}
                style={[styles.leaderRow, index > 0 && styles.leaderRowDivider]}>
                <View style={styles.rankBadge}>
                  <row.Icon size={wp(17)} color={GOLD_CREAM} strokeWidth={2} />
                </View>
                <Text style={styles.leaderName}>{row.name}</Text>
                <Text style={styles.leaderRevenue}>{fmt(row.revenue || 0)}</Text>
              </View>
            ))}
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  headerArea: {
    alignItems: 'center',
    paddingHorizontal: wp(18),
    paddingBottom: hp(18),
  },
  title: {
    fontSize: fp(22),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: wp(18),
    paddingTop: hp(20),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: wp(30),
    paddingBottom: hp(10),
  },
  stepItem: {
    alignItems: 'center',
    width: wp(64),
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: wp(19),
  },
  stepCircle: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
  },
  stepRingActive: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(6),
    shadowColor: GOLD_GLOW,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: wp(10),
    elevation: 10,
  },
  stepCircleActive: {
    width: wp(35),
    height: wp(35),
    borderRadius: wp(17.5),
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: fp(9),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stepLabelActive: {
    color: '#F0C040',
    fontWeight: '700',
  },

  // Hero card
  heroCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(214,156,63,0.50)',
    borderRadius: wp(20),
    paddingTop: hp(20),
    paddingHorizontal: wp(18),
    marginBottom: hp(14),
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  heroLabel: {
    fontSize: fp(11),
    fontWeight: '600',
    letterSpacing: 2,
    color: LABEL_TAN,
    flex: 1,
  },
  heroPill: {
    borderWidth: 1,
    borderColor: 'rgba(248,222,174,0.45)',
    backgroundColor: 'rgba(214,156,63,0.10)',
    borderRadius: wp(20),
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    marginLeft: wp(8),
    maxWidth: wp(110),
  },
  heroPillText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: GOLD_CREAM,
  },
  heroValue: {
    fontSize: fp(42),
    fontWeight: '500',
    color: GOLD_CREAM,
    letterSpacing: 1,
  },
  heroChart: {
    marginTop: hp(8),
    marginHorizontal: -wp(18),
  },

  // Summary cards
  statsRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(14),
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    padding: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  statLabel: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#9A9A9E',
    letterSpacing: 1,
    marginBottom: hp(8),
  },
  statValueLight: {
    fontSize: fp(26),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statValueAccent: {
    fontSize: fp(26),
    fontWeight: '800',
    color: GOLD_CREAM,
  },

  // Section / breakdown card (session details)
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(14),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  sectionTitle: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#9A9A9E',
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
    color: '#A8A8AC',
    flex: 1,
  },
  breakdownPrice: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Product overview
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
    paddingHorizontal: wp(2),
  },
  overviewHeading: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },
  overviewHeadingRight: {
    fontSize: fp(12),
    fontWeight: '600',
    color: GOLD_CREAM,
  },
  listCard: {
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: wp(14),
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
  },
  leaderRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  rankBadge: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
    backgroundColor: 'rgba(214,156,63,0.12)',
  },
  leaderName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  leaderRevenue: {
    fontSize: fp(14),
    fontWeight: '700',
    color: GOLD_CREAM,
  },
});
