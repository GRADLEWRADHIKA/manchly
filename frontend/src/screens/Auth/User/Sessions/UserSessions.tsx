import React, {useEffect, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeader from '../../../../components/AppHeader';
import {getMySessions, getSessionStats, createSession} from '../../../../store/SessionSlice';

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
            <Clock size={wp(12)} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={styles.detailText}>{item.duration} min</Text>
          </View>
          <View style={styles.detailChip}>
            <IndianRupee size={wp(12)} color={colors.textSecondary} strokeWidth={2} />
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
          <PhoneCall size={wp(20)} color={colors.secPrimary} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={wp(20)} color={colors.secPrimary} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_minutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <IndianRupee size={wp(20)} color={colors.secPrimary} strokeWidth={1.8} />
          <Text style={styles.statValue}>
            ₹{Number(stats.total_earnings || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      {/* Browse Experts CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ExpertList')}>
        <View style={styles.ctaLeft}>
          <View style={styles.ctaIconWrap}>
            <PhoneCall size={wp(22)} color={colors.white} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={styles.ctaTitle}>Browse Experts</Text>
            <Text style={styles.ctaSub}>
              Find & book session experts instantly
            </Text>
          </View>
        </View>
        <ChevronRight size={wp(20)} color={colors.white + '80'} strokeWidth={2} />
      </TouchableOpacity>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Session History</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <PhoneMissed size={wp(40)} color={colors.textMuted} strokeWidth={1.2} />
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyText}>
        Visit a creator's profile to start a video session.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Sessions" />

      {loading && sessions.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.secPrimary} />
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.white,
    borderRadius: wp(14),
    paddingVertical: hp(16),
    alignItems: 'center',
    gap: hp(4),
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fp(10),
    color: colors.textMuted,
    fontWeight: '500',
  },

  // CTA
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secPrimary,
    borderRadius: wp(16),
    padding: wp(16),
    marginBottom: hp(20),
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  ctaIconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
  ctaSub: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp(1),
  },

  // Section
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(10),
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    color: colors.text,
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
    borderTopColor: colors.borderLight,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.surface,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  detailText: {
    fontSize: fp(11),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: hp(50),
    gap: hp(10),
  },
  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: wp(30),
  },
});
