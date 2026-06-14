import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Video, PhoneCall, Clock, CheckCircle } from 'lucide-react-native';
import { PhoneOutgoing } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getMySessions } from '../../../../store/SessionSlice';
import SocketService from '../../../../services/SocketService';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const LIMIT = 15;

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
];

const AllSessions = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  const [activeTab, setActiveTab] = useState('active');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const tabPadding = wp(3);
  const sliderWidth = tabBarWidth > 0 ? (tabBarWidth - tabPadding * 2) / 2 : 0;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getStatusForTab = (tab: string) => {
    if (tab === 'active') return 'PENDING';
    return 'COMPLETED';
  };

  const fetchData = useCallback((pageNum: number, tab: string, refresh = false) => {
    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    dispatch(getMySessions({
      role: 'receiver',
      status: getStatusForTab(tab),
      page: pageNum,
      limit: LIMIT,
    }))
      .unwrap()
      .then((response: any) => {
        const sessions = response?.data?.sessions || [];
        if (refresh) {
          setData(sessions);
        } else {
          setData(prev => [...prev, ...sessions]);
        }
        setHasMore(sessions.length >= LIMIT);
        setPage(pageNum);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [dispatch]);

  useEffect(() => {
    fetchData(1, activeTab, true);
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    const toValue = tab === 'active' ? 0 : 1;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();
    setActiveTab(tab);
    setData([]);
    setPage(1);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchData(page + 1, activeTab, false);
    }
  };

  const handleCallUser = (session: any) => {
    SocketService.emit('call_user', {
      receiverId: session.caller_id,
      callId: session.call_id,
      sessionId: session.id,
      mode: 'video',
    });
    navigation.navigate('CallScreen', {
      callID: session.call_id,
      userID: user?.id,
      userName: user?.name || 'Expert',
      mode: 'video',
      sessionId: session.id,
      otherUserId: session.caller_id,
    });
  };

  const renderItem = ({ item: session }: { item: any }) => {
    const callerName = session.caller?.name || 'User';
    const initials = callerName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const isCompleted = session.status === 'COMPLETED';

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionLeft}>
          <View style={[styles.sessionAvatar, isCompleted && styles.sessionAvatarCompleted]}>
            <Text style={[styles.sessionAvatarText, isCompleted && styles.sessionAvatarTextCompleted]}>
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionName}>{callerName}</Text>
            <View style={styles.sessionMeta}>
              <Video size={wp(12)} color={isCompleted ? '#94A3B8' : colors.cSuccess} strokeWidth={1.8} />
              <Text style={styles.sessionMetaText}>{session.duration} min</Text>
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
            {isCompleted && session.amount > 0 && (
              <Text style={styles.sessionEarned}>Earned ₹{session.amount}</Text>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: hp(4) }}>
          {session.status === 'PENDING' ? (
            <TouchableOpacity
              style={styles.callUserBtn}
              activeOpacity={0.8}
              onPress={() => handleCallUser(session)}
            >
              <PhoneOutgoing size={wp(14)} color={colors.white} strokeWidth={2} />
              <Text style={styles.callUserBtnText}>Call</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusChip}>
              <CheckCircle size={wp(12)} color={'#22C55E'} />
              <Text style={styles.statusChipText}>Done</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.cAccentLight} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        {activeTab === 'active' ? (
          <PhoneCall size={wp(32)} color={colors.cTextMuted} strokeWidth={1.2} />
        ) : (
          <Clock size={wp(32)} color={colors.cTextMuted} strokeWidth={1.2} />
        )}
        <Text style={styles.emptyText}>
          {activeTab === 'active' ? 'No active sessions' : 'No session history yet'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="All Sessions" />

      {/* Tabs with sliding indicator */}
      <View style={styles.tabContainer}>
        <View
          style={styles.tabRow}
          onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        >
          {sliderWidth > 0 && (
            <Animated.View
              style={[
                styles.tabSlider,
                {
                  width: sliderWidth,
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, sliderWidth],
                    }),
                  }],
                },
              ]}
            />
          )}
          {TABS.map(tab => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.cAccentLight} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default AllSessions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: wp(16),
    paddingTop: hp(8),
    paddingBottom: hp(20),
  },

  // Tabs
  tabContainer: {
    paddingHorizontal: wp(16),
    marginTop: hp(10),
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: wp(12),
    padding: wp(3),
    position: 'relative',
  },
  tabSlider: {
    position: 'absolute',
    top: wp(3),
    left: wp(3),
    height: '100%',
    backgroundColor: '#1A1A2E',
    borderRadius: wp(10),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(10),
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: colors.white,
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(16),
    gap: wp(8),
  },
  loadingText: {
    color: '#64748B',
    fontSize: fp(13),
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(60),
    gap: hp(8),
  },
  emptyText: {
    fontSize: fp(13),
    color: '#94A3B8',
  },

  // Session card
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    flex: 1,
  },
  sessionAvatar: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(12),
    backgroundColor: colors.cAccentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionAvatarCompleted: {
    backgroundColor: '#F1F5F9',
  },
  sessionAvatarText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.cAccentLight,
  },
  sessionAvatarTextCompleted: {
    color: '#94A3B8',
  },
  sessionName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: '#1A1A2E',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(2),
  },
  sessionMetaText: {
    fontSize: fp(10),
    color: '#94A3B8',
  },
  sessionEarned: {
    fontSize: fp(11),
    fontWeight: '600',
    color: '#22C55E',
    marginTop: hp(2),
  },
  dot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2),
    backgroundColor: '#94A3B8',
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
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  statusChipText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: '#22C55E',
  },
});
