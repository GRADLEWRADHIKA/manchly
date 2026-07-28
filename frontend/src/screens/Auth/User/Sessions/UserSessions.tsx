import React, {useEffect, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  Video,
  Clock,
  PhoneCall,
  IndianRupee,
  PhoneMissed,
  ChevronRight,
  X,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeader from '../../../../components/AppHeader';
import {getMySessions, getSessionStats} from '../../../../store/SessionSlice';
import { LinearGradient } from 'react-native-linear-gradient';
import ShimmerBox from '../../../../components/ShimmerBox';
import BrowseIcon from '../../../../image/BrowseIcon';

const SessionsSkeleton = () => (
  <View style={styles.listContent}>
    {/* Stats row */}
    <View style={styles.statsRow}>
      {[0, 1, 2].map(i => (
        <ShimmerBox key={i} height={hp(92)} radius={wp(14)} style={{flex: 1}} />
      ))}
    </View>
    {/* CTA card */}
    <ShimmerBox
      height={hp(232)}
      radius={wp(20)}
      style={{marginBottom: hp(20)}}
    />
    {/* Section title */}
    <View style={styles.sectionRow}>
      <ShimmerBox width={wp(150)} height={hp(18)} radius={wp(5)} />
      <ShimmerBox width={wp(60)} height={hp(14)} radius={wp(5)} />
    </View>
    {/* Session cards */}
    {[0, 1, 2].map(i => (
      <ShimmerBox
        key={i}
        height={hp(104)}
        radius={wp(14)}
        style={{marginBottom: hp(10)}}
      />
    ))}
  </View>
);

const UserSessions: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const {sessions, stats, loading} = useSelector(
    (state: any) => state.sessionReducer,
  );
  const {user} = useSelector((state: any) => state.userReducer);

  useEffect(() => {
    if (isFocused) {
      dispatch(getMySessions({role: 'caller', page: 1, limit: 30}));
      dispatch(getSessionStats());
    }
  }, [isFocused]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {bg: colors.success + '15', color: colors.success};
      case 'ACTIVE':
        return {bg: colors.info + '15', color: colors.info};
      case 'MISSED':
        return {bg: colors.error + '15', color: colors.error};
      default:
        return {bg: colors.textMuted + '15', color: colors.textMuted};
    }
  };

  const renderSession = ({item}: {item: any}) => {
    const st = getStatusStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View
            style={[
              styles.modeIcon,
              {backgroundColor: colors.success + '12'},
            ]}>
            <Video size={wp(18)} color={colors.success} strokeWidth={1.8} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {item.receiver?.name || 'Video Call'}
            </Text>
            <Text style={styles.cardDate}>
              Video · {new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: st.bg}]}>
            <Text style={[styles.statusText, {color: st.color}]}>
              {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.detailChip}>
            <Clock size={wp(12)} color='#BDC2FF' strokeWidth={1.8} />
            <Text style={styles.detailText}>{item.duration} min</Text>
          </View>
          <View style={styles.detailChip}>
            <IndianRupee size={wp(12)} color='#BDC2FF' strokeWidth={2} />
            <Text style={styles.detailText}>{item.amount}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailText}>
              ₹{item.rate_per_min}/min
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <PhoneCall size={wp(20)} color={colors.uBottomText} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_sessions}</Text>
          <Text style={styles.statLabel}>SESSIONS</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={wp(20)} color={colors.uBottomText} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_minutes}</Text>
          <Text style={styles.statLabel}>MINUTES</Text>
        </View>
        <View style={styles.statCard}>
          <IndianRupee size={wp(20)} color={colors.uBottomText} strokeWidth={1.8} />
          <Text style={styles.statValue}>
            ₹{Number(stats.total_earnings || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>SPENT</Text>
        </View>
      </View>

      {/* Browse Experts CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ExpertList')}>
        <View style={styles.ctaIconWrap}>
          <BrowseIcon size={wp(26)} color={colors.info} strokeWidth={1.8} />
        </View>
        <Text style={styles.ctaTitle}>Browse Experts</Text>
        <Text style={styles.ctaSub}>
          Find and book session experts{'\n'}instantly for personalized mentorship.
        </Text>
        {/* Updated Explore Now Button */}
        <LinearGradient
          colors={[colors.btnGradientStart, colors.btnGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaBtnText}>Explore Now</Text>
          <ChevronRight size={wp(16)} color={colors.textPrimary} strokeWidth={2} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Section Title */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Session History</Text>
        <Text style={styles.viewAllText}>View All</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <PhoneMissed size={wp(30)} color={colors.textMuted} strokeWidth={1.2} />
        <View style={styles.emptyBadge}>
          <X size={wp(10)} color={colors.textPrimary} strokeWidth={3} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyText}>
        Start your journey toward mastery. Visit a creator's profile to start a live video session.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="My journey" />

      {loading && sessions.length === 0 ? (
        <SessionsSkeleton />
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
    backgroundColor: colors.uBg,
  },
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
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    gap: hp(4),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.sessionText,
  },
  statLabel: {
    fontSize: fp(9),
    color: colors.sessionText2,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // CTA
  ctaCard: {
    alignItems: 'center',
    backgroundColor: colors.uCard,
    borderRadius: wp(20),
    padding: wp(24),
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  ctaIconWrap: {
    width: wp(56),
    height: wp(56),
    borderRadius: wp(16),
    backgroundColor: '#BDC2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(14),
  },
  ctaTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  ctaSub: {
    fontSize: fp(12.5),
    color: '#C5C5D8',
    textAlign: 'center',
    lineHeight: fp(18),
    marginBottom: hp(18),
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: wp(24),
  },
  ctaBtnText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Section
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.uSubHeading,
  },

  // Cards
  card: {
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.uCard,
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
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: fp(11),
    color: colors.textMuted,
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
    borderTopColor: colors.border,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.uBg,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  detailText: {
    fontSize: fp(11),
    color: colors.uSubHeading,
    fontWeight: '500',
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.uCard,
    borderRadius: wp(20),
    paddingVertical: hp(40),
    paddingHorizontal: wp(24),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  emptyIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.uBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(16),
    position: 'relative',
  },
  emptyBadge: {
    position: 'absolute',
    top: -wp(2),
    right: -wp(2),
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D112B',
  },
  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(8),
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.uSubHeading,
    textAlign: 'center',
    lineHeight: fp(19),
    paddingHorizontal: wp(10),
  },
});