import React, {useState, useEffect, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Phone,
  Video,
  IndianRupee,
  Clock,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  PhoneCall,
} from 'lucide-react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {Plus, Trash2, PhoneOutgoing} from 'lucide-react-native';
import SocketService from '../../../../services/SocketService';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {getMySessions, getSessionStats, getMySessionProducts, deleteSessionProduct, getMyExpertProfile, updateExpertProfile} from '../../../../store/SessionSlice';

const CreatorSessions: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const {sessions, stats, loading, products, expertProfile} = useSelector(
    (state: any) => state.sessionReducer,
  );

  const [isAvailable, setIsAvailable] = useState(expertProfile?.is_available ?? false);

  useEffect(() => {
    if (isFocused) {
      dispatch(getMyExpertProfile());
      dispatch(getMySessions({role: 'receiver', page: 1, limit: 20}));
      dispatch(getSessionStats());
      dispatch(getMySessionProducts());
    }
  }, [isFocused]);

  useEffect(() => {
    if (expertProfile) setIsAvailable(expertProfile.is_available);
  }, [expertProfile]);

  const toggleAvailability = () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    dispatch(updateExpertProfile({is_available: newVal}));
  };

  const {user} = useSelector((state: any) => state.userReducer);

  const handleCallUser = (session: any) => {
    // Ring the user via socket
    SocketService.emit('call_user', {
      receiverId: session.caller_id,
      callId: session.call_id,
      sessionId: session.id,
      mode: session.mode === 'VIDEO' ? 'video' : 'call',
    });

    // Navigate expert to call screen
    navigation.navigate('CallScreen', {
      callID: session.call_id,
      userID: user?.id,
      userName: user?.name || 'Expert',
      mode: session.mode === 'VIDEO' ? 'video' : 'call',
      sessionId: session.id,
      otherUserId: session.caller_id,
    });
  };

  // If not registered as expert, show registration CTA
  if (!expertProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.regContent}>
          <View style={styles.regIcon}>
            <PhoneCall size={wp(36)} color={colors.info} strokeWidth={1.5} />
          </View>
          <Text style={styles.regTitle}>Become a Session Expert</Text>
          <Text style={styles.regSub}>
            Register to offer paid 1:1 audio & video sessions to users. Set your rates, manage availability, and earn.
          </Text>
          <TouchableOpacity
            style={styles.regBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ExpertRegistration')}>
            <Text style={styles.regBtnText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Availability Toggle */}
      <View style={styles.availCard}>
        <View style={styles.availLeft}>
          <View
            style={[
              styles.availDot,
              {backgroundColor: isAvailable ? colors.success : colors.textMuted},
            ]}
          />
          <View>
            <Text style={styles.availTitle}>
              {isAvailable ? 'Available for Calls' : 'Unavailable'}
            </Text>
            <Text style={styles.availSub}>
              {isAvailable
                ? 'Users can call you now'
                : 'Turn on to receive calls'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={toggleAvailability}
          activeOpacity={0.7}>
          {isAvailable ? (
            <ToggleRight size={wp(32)} color={colors.success} strokeWidth={1.8} />
          ) : (
            <ToggleLeft size={wp(32)} color={colors.textMuted} strokeWidth={1.8} />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <PhoneCall size={wp(18)} color={colors.info} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={wp(18)} color={colors.info} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_minutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={wp(18)} color={colors.info} strokeWidth={1.8} />
          <Text style={styles.statValue}>
            {stats.total_earnings >= 1000
              ? `₹${(stats.total_earnings / 1000).toFixed(1)}k`
              : `₹${stats.total_earnings}`}
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* My Session Products */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>My Session Products</Text>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreateSessionProduct')}>
          <Plus size={wp(16)} color={colors.info} strokeWidth={2} />
          <Text style={styles.addBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <TouchableOpacity
          style={styles.createCta}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreateSessionProduct')}>
          <Plus size={wp(20)} color={colors.info} strokeWidth={1.8} />
          <Text style={styles.createCtaText}>Create your first session product</Text>
        </TouchableOpacity>
      ) : (
        products.map((product: any) => {
          const isVideo = product.mode === 'VIDEO';
          return (
            <View key={product.id} style={styles.modeCard}>
              <View
                style={[
                  styles.modeIconWrap,
                  {backgroundColor: isVideo ? colors.success + '15' : colors.info + '15'},
                ]}>
                {isVideo ? (
                  <Video size={wp(22)} color={colors.success} strokeWidth={1.8} />
                ) : (
                  <Phone size={wp(22)} color={colors.info} strokeWidth={1.8} />
                )}
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>{product.title}</Text>
                <View style={styles.modeRateRow}>
                  <Text style={styles.modeRate}>
                    {product.duration} min · ₹{product.price}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.7}
                onPress={() => dispatch(deleteSessionProduct(product.id))}>
                <Trash2 size={wp(16)} color={colors.error} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* Recent Sessions */}
      <Text style={[styles.sectionTitle, {marginTop: hp(20)}]}>
        Recent Sessions
      </Text>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.info}
          style={{marginTop: hp(20)}}
        />
      ) : sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <PhoneCall size={wp(32)} color={colors.textMuted} strokeWidth={1.2} />
          <Text style={styles.emptyText}>No sessions yet</Text>
        </View>
      ) : (
        sessions.map((session: any) => {
          const callerName = session.caller?.name || 'User';
          const initials = callerName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          return (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionLeft}>
                <View style={styles.sessionAvatar}>
                  <Text style={styles.sessionAvatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={styles.sessionName}>{callerName}</Text>
                  <View style={styles.sessionMeta}>
                    {session.mode === 'VIDEO' ? (
                      <Video size={wp(12)} color={colors.success} strokeWidth={1.8} />
                    ) : (
                      <Phone size={wp(12)} color={colors.info} strokeWidth={1.8} />
                    )}
                    <Text style={styles.sessionMetaText}>
                      {session.duration} min
                    </Text>
                    <View style={styles.dot} />
                    <Text style={styles.sessionMetaText}>
                      {new Date(session.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              {session.status === 'PENDING' ? (
                <TouchableOpacity
                  style={styles.callUserBtn}
                  activeOpacity={0.8}
                  onPress={() => handleCallUser(session)}>
                  <PhoneOutgoing size={wp(14)} color={colors.white} strokeWidth={2} />
                  <Text style={styles.callUserBtnText}>Call</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.sessionAmount}>₹{session.amount}</Text>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default memo(CreatorSessions);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
    paddingBottom: hp(30),
  },
  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: hp(16),
  },
  availLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  availDot: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
  },
  availTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
  },
  availSub: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(1),
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(20),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: 'center',
    gap: hp(4),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  sectionTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(8),
    backgroundColor: colors.info + '12',
  },
  addBtnText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.info,
  },
  createCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(18),
    borderWidth: 1.5,
    borderColor: colors.info + '30',
    borderStyle: 'dashed',
    marginBottom: hp(10),
  },
  createCtaText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.info,
  },
  deleteBtn: {
    padding: wp(8),
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  modeCardActive: {
    borderColor: colors.info + '40',
  },
  modeIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: wp(12),
  },
  modeName: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
  },
  modeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
  },
  modeRate: {
    fontSize: fp(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modeToggle: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(8),
  },
  modeToggleText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(40),
    gap: hp(8),
  },
  emptyText: {
    fontSize: fp(13),
    color: colors.textMuted,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  sessionAvatar: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    backgroundColor: colors.info + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionAvatarText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.info,
  },
  sessionName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(2),
  },
  sessionMetaText: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  dot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2),
    backgroundColor: colors.textMuted,
  },
  sessionAmount: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.info,
  },
  callUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.success,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(8),
  },
  callUserBtnText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.white,
  },
  regContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(32),
  },
  regIcon: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(24),
    backgroundColor: colors.info + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(20),
  },
  regTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  regSub: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
    marginTop: hp(8),
    marginBottom: hp(24),
  },
  regBtn: {
    backgroundColor: colors.info,
    borderRadius: wp(14),
    paddingHorizontal: wp(32),
    paddingVertical: hp(14),
  },
  regBtnText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
  },
});
