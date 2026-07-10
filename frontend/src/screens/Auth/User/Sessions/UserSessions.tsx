import React, { useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Video,
  Clock,
  PhoneCall,
  IndianRupee,
  PhoneMissed,
  Menu,
  Bell,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { getMySessions, getSessionStats } from '../../../../store/SessionSlice';

const UserSessions: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const { sessions, stats, loading } = useSelector(
    (state: any) => state.sessionReducer,
  );

  useEffect(() => {
    if (isFocused) {
      dispatch(getMySessions({ role: 'caller', page: 1, limit: 30 }));
      dispatch(getSessionStats());
    }
  }, [isFocused]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: colors.success + '15', color: colors.success };
      case 'ACTIVE':
        return { bg: colors.info + '15', color: colors.info };
      case 'MISSED':
        return { bg: colors.error + '15', color: colors.error };
      default:
        return { bg: colors.cTextMuted + '15', color: colors.cTextMuted };
    }
  };

  // ── Session Card ─────────────────────────────────────────────────────────────
  const renderSession = ({ item }: { item: any }) => {
    const st = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.modeIcon, { backgroundColor: colors.success + '12' }]}>
            <Video size={wp(18)} color={colors.success} strokeWidth={1.8} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {item.receiver?.name || 'Video Call'}
            </Text>
            <Text style={styles.cardDate}>
              Video ·{' '}
              {new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>
              {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.detailChip}>
            <Clock size={wp(12)} color={colors.cTextSecondary} strokeWidth={1.8} />
            <Text style={styles.detailText}>{item.duration} min</Text>
          </View>
          <View style={styles.detailChip}>
            <IndianRupee size={wp(12)} color={colors.cTextSecondary} strokeWidth={2} />
            <Text style={styles.detailText}>{item.amount}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailText}>₹{item.rate_per_min}/min</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── List Header ──────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <PhoneCall size={wp(20)} color={colors.cTextSecondary} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats?.total_sessions ?? 0}</Text>
          <Text style={styles.statLabel}>SESSIONS</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={wp(20)} color={colors.cTextSecondary} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats?.total_minutes ?? 0}</Text>
          <Text style={styles.statLabel}>MINUTES</Text>
        </View>
        <View style={styles.statCard}>
          <IndianRupee size={wp(20)} color={colors.cTextSecondary} strokeWidth={1.8} />
          <Text style={styles.statValue}>
            ₹{Number(stats?.total_earnings || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>SPENT</Text>
        </View>
      </View>

      {/* Browse Experts CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ExpertList')}
      >
        <View style={styles.ctaIconCircle}>
          <PhoneCall size={wp(26)} color={colors.white} strokeWidth={1.8} />
        </View>
        <Text style={styles.ctaTitle}>Browse Experts</Text>
        <Text style={styles.ctaSub}>
          Find and book session experts instantly for personalized mentorship.
        </Text>
        <View style={styles.exploreBtn}>
          <Text style={styles.exploreBtnText}>Explore Now →</Text>
        </View>
      </TouchableOpacity>

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Session History</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Empty State ──────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <View style={styles.emptyIconCircle}>
          <PhoneMissed size={wp(22)} color={colors.white} strokeWidth={1.8} />
        </View>
        <View style={styles.emptyIconBadge}>
          <Text style={styles.emptyIconBadgeText}>✕</Text>
        </View>
      </View>
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyText}>
        Start your journey toward mastery.{'\n'}Visit a creator's profile to start a live
        video session.
      </Text>
      <TouchableOpacity
        style={styles.searchInstructorsBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ExpertList')}
      >
        <Text style={styles.searchInstructorsBtnText}>Search Instructors</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Root Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Menu size={22} color={colors.cText} />
        <Text style={styles.brandTitle}>Manchly</Text>
        <Bell size={22} color={colors.cText} />
      </View>

      {loading && sessions.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default memo(UserSessions);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cBg,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingBottom: hp(12),
    backgroundColor: colors.cBg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.cBorder,
  },
  brandTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    paddingBottom: hp(30),
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(14),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cCard,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    gap: hp(4),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.cText,
  },
  statLabel: {
    fontSize: fp(10),
    color: colors.cTextMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // CTA Card
  ctaCard: {
    alignItems: 'center',
    backgroundColor: colors.cCard,
    borderRadius: wp(16),
    padding: wp(20),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  ctaIconCircle: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: 'rgba(99,102,241,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
  },
  ctaTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.cText,
    marginBottom: hp(6),
  },
  ctaSub: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    textAlign: 'center',
    lineHeight: fp(18),
    marginBottom: hp(16),
    paddingHorizontal: wp(10),
  },
  exploreBtn: {
    backgroundColor: colors.cAccentLight,
    borderRadius: 99,
    paddingHorizontal: wp(28),
    paddingVertical: hp(12),
  },
  exploreBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(14),
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.cText,
  },
  viewAllText: {
    fontSize: fp(12),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },

  // Session Card
  card: {
    backgroundColor: colors.cCard,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.cBorder,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  cardName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.cText,
  },
  cardDate: {
    fontSize: fp(11),
    color: colors.cTextMuted,
    marginTop: hp(2),
  },
  statusBadge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  statusText: {
    fontSize: fp(10),
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    gap: wp(12),
    marginTop: hp(10),
    paddingTop: hp(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cBorder,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.cSurface,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  detailText: {
    fontSize: fp(11),
    color: colors.cTextSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.cCard,
    borderRadius: wp(16),
    padding: wp(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cBorder,
    marginTop: hp(10),
  },
  emptyIconWrap: {
    position: 'relative',
    marginBottom: hp(16),
  },
  emptyIconCircle: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.cCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cCard,
  },
  emptyIconBadgeText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.cText,
    marginBottom: hp(8),
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.cTextSecondary,
    textAlign: 'center',
    lineHeight: fp(19),
    paddingHorizontal: wp(10),
    marginBottom: hp(16),
  },
  searchInstructorsBtn: {
    borderWidth: 1,
    borderColor: colors.cBorder,
    borderRadius: 99,
    paddingHorizontal: wp(28),
    paddingVertical: hp(12),
  },
  searchInstructorsBtnText: {
    color: colors.cText,
    fontWeight: '600',
    fontSize: fp(14),
  },
});