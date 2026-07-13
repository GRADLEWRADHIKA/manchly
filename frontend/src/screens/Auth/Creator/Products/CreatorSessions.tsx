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
  Video,
  IndianRupee,
  Clock,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  PhoneCall,
  Settings,
  Calendar,
  Handshake,
} from 'lucide-react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {PhoneOutgoing} from 'lucide-react-native';
import SocketService from '../../../../services/SocketService';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import {getMySessions, getSessionStats, getMyExpertProfile, updateExpertProfile, getMySessionProducts, updateSessionProduct, deleteSessionProduct} from '../../../../store/SessionSlice';
import AiButton from '../../../../components/AiButton';
import PrepChecklistModal from '../../../../components/ai/PrepChecklistModal';

const CreatorSessions: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const {sessions, stats, loading, expertProfile} = useSelector(
    (state: any) => state.sessionReducer,
  );

  const [isAvailable, setIsAvailable] = useState(expertProfile?.is_available ?? false);
  const [prepModal, setPrepModal] = useState<{visible: boolean; title: string; context?: string}>({visible: false, title: ''});

  useEffect(() => {
    if (isFocused) {
      dispatch(getMyExpertProfile());
      dispatch(getMySessions({role: 'receiver', page: 1, limit: 20}));
      dispatch(getSessionStats());
    }
  }, [isFocused]);

  useEffect(() => {
    if (expertProfile) setIsAvailable(expertProfile.is_available);
  }, [expertProfile]);

  const toggleAvailability = () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    dispatch(updateExpertProfile({is_available: newVal}));
    SocketService.emit('expert_availability_changed', {
      is_available: newVal,
      expert_id: expertProfile?.id,
    });
  };

  const {user} = useSelector((state: any) => state.userReducer);

  const handleCallUser = (session: any) => {
    // Ring the user via socket
    SocketService.emit('call_user', {
      receiverId: session.caller_id,
      callId: session.call_id,
      sessionId: session.id,
      mode: 'video',
    });

    // Navigate expert to call screen
    navigation.navigate('CallScreen', {
      callID: session.call_id,
      userID: user?.id,
      userName: user?.name || 'Expert',
      mode: 'video',
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
            <PhoneCall size={wp(36)} color={colors.gold} strokeWidth={1.5} />
          </View>
          <Text style={styles.regTitle}>Become a Session Expert</Text>
          <Text style={styles.regSub}>
            Register to offer paid 1:1 video sessions to users. Set your rates, manage availability, and earn.
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
              {backgroundColor: isAvailable ? colors.cSuccess : colors.textMuted},
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
            <ToggleRight size={wp(32)} color={colors.cSuccess} strokeWidth={1.8} />
          ) : (
            <ToggleLeft size={wp(32)} color={colors.textMuted} strokeWidth={1.8} />
          )}
        </TouchableOpacity>
      </View>

      {/* Edit Profile */}
      <TouchableOpacity
        style={styles.editBtn}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('ExpertRegistration', {
            expertProfile: expertProfile,
          })
        }>
        <Settings size={wp(16)} color={colors.gold} strokeWidth={1.8} />
        <Text style={styles.editBtnText}>Edit Session Profile</Text>
      </TouchableOpacity>

      {/* Manage Availability */}
      <TouchableOpacity
        style={styles.editBtn}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AvailabilityManager')}>
        <Calendar size={wp(16)} color={colors.cAccentLight} strokeWidth={1.8} />
        <Text style={styles.editBtnText}>Manage Availability</Text>
      </TouchableOpacity>

      {/* Stats Row */}
      <Text style={styles.overviewLabel}>YOUR OVERVIEW</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <PhoneCall size={wp(18)} color={colors.gold} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_sessions}</Text>
          <Text style={styles.statLabel}>SESSIONS</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={wp(18)} color={colors.gold} strokeWidth={1.8} />
          <Text style={styles.statValue}>{stats.total_minutes}</Text>
          <Text style={styles.statLabel}>MINUTES</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={wp(18)} color={colors.gold} strokeWidth={1.8} />
          <Text style={styles.statValue}>
            ₹{Number(stats.total_earnings || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>EARNED</Text>
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          Recent Sessions
        </Text>
        {sessions.length > 3 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AllSessions')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={colors.gold}
          style={{marginTop: hp(20)}}
        />
      ) : sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Handshake size={wp(28)} color={colors.gold} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>
            Your session history will appear here. Visit a creator's profile to start a new video session and build your professional history.
          </Text>
        </View>
      ) : (
        sessions.slice(0, 3).map((session: any) => {
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
                    <Video size={wp(12)} color={colors.cSuccess} strokeWidth={1.8} />
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
              <View style={{alignItems: 'flex-end', gap: hp(4)}}>
                {session.status === 'PENDING' ? (
                  <>
                    <TouchableOpacity
                      style={styles.callUserBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCallUser(session)}>
                      <PhoneOutgoing size={wp(14)} color={colors.bg} strokeWidth={2} />
                      <Text style={styles.callUserBtnText}>Call</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.sessionAmount}>₹{session.amount}</Text>
                  </>
                )}
              </View>
            </View>
          );
        })
      )}
      <PrepChecklistModal
        visible={prepModal.visible}
        onClose={() => setPrepModal({visible: false, title: ''})}
        productTitle={prepModal.title}
        learnerContext={prepModal.context}
      />

    </ScrollView>
  );
};

export default memo(CreatorSessions);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textPrimary,
  },
  availSub: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(1),
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    backgroundColor: colors.surface,
    borderRadius: wp(10),
    paddingVertical: hp(10),
    marginBottom: hp(20),
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderStyle: 'dashed',
  },
  editBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.gold,
  },
  overviewLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.5,
    marginBottom: hp(10),
  },
  statsRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(20),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    paddingVertical: hp(14),
    alignItems: 'center',
    gap: hp(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fp(9),
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
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
    color: colors.gold,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(8),
    backgroundColor: colors.goldDim,
  },
  addBtnText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.gold,
  },
  createCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    padding: wp(18),
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: hp(10),
  },
  createCtaText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.gold,
  },
  deleteBtn: {
    padding: wp(8),
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modeCardActive: {
    borderColor: colors.gold,
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
    color: colors.textPrimary,
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
    color: colors.bg,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: hp(36),
    paddingHorizontal: wp(24),
  },
  emptyIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(14),
  },
  emptyTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  emptyText: {
    fontSize: fp(12),
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fp(18),
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionAvatarText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.gold,
  },
  sessionName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(2),
  },
  sessionMetaText: {
    fontSize: fp(10),
    color: colors.textSecondary,
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
    color: colors.gold,
  },
  callUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.cSuccess,
    paddingHorizontal: wp(12),
    paddingVertical: hp(6),
    borderRadius: wp(8),
  },
  callUserBtnText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.bg,
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
    backgroundColor: colors.goldDim,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(20),
  },
  regTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.textPrimary,
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
    backgroundColor: colors.gold,
    borderRadius: wp(14),
    paddingHorizontal: wp(32),
    paddingVertical: hp(14),
  },
  regBtnText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.bg,
  },
});