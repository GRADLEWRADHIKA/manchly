import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  TrendingUp,
  Video,
  Calendar,
  Info,
  Bell,
  CheckCheck,
  ShoppingCart,
  Star,
  CreditCard,
  Users,
  AlertCircle,
  Megaphone,
  ArrowLeft,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  getCreatorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  Notification,
} from '../../../../store/NotificationSlice';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'sale', label: 'Sales' },
  { key: 'session', label: 'Sessions' },
  { key: 'webinar', label: 'Webinars' },
  { key: 'system', label: 'System' },
];

const ICON_CONFIG: Record<string, { icon: any }> = {
  'New Course Purchase': { icon: ShoppingCart },
  'Webinar Enrollment': { icon: Users },
  'Session Booked': { icon: Calendar },
  'Webinar Starting Soon': { icon: AlertCircle },
  'Payout Processed': { icon: CreditCard },
  'New Review': { icon: Star },
  'KYC Approved': { icon: CheckCheck },
  'New Feature Available': { icon: Megaphone },
};

const TYPE_ICON: Record<string, { icon: any }> = {
  sale: { icon: TrendingUp },
  session: { icon: Calendar },
  webinar: { icon: Video },
  system: { icon: Info },
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

const CreatorNotification = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { notifications: storeNotifications, loading } = useSelector(
    (state: any) => state.notificationReducer,
  );
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const notifications: Notification[] = storeNotifications || [];

  const filtered =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n: Notification) => n.type === activeTab);

  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

  useEffect(() => {
    dispatch(getCreatorNotifications({}));
    return () => {
      dispatch(getUnreadCount());
    };
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getCreatorNotifications({}));
    setRefreshing(false);
  }, [dispatch]);

  const handlePress = (item: Notification) => {
    if (!item.is_read) {
      dispatch(markNotificationRead(item._id));
    }
    // Deep link to relevant screen based on notification data
    if (item.data?.courseId) {
      navigation.navigate('CourseDetailsScreen', { courseId: item.data.courseId });
    } else if (item.data?.webinarId) {
      navigation.navigate('WebinarDetails', { webinarId: item.data.webinarId, id: item.data.webinarId });
    } else if (item.data?.sessionId) {
      navigation.navigate('SessionDetails', { sessionId: item.data.sessionId });
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead()).then(() => {
      dispatch(getUnreadCount());
    });
  };

  const getIconForItem = (item: Notification) => {
    return ICON_CONFIG[item.title] || TYPE_ICON[item.type] || TYPE_ICON.system;
  };

  const hasDeepLink = (item: Notification) =>
    !!(item.data?.courseId || item.data?.webinarId || item.data?.sessionId);

  const renderItem = ({ item }: { item: Notification }) => {
    const { icon: Icon } = getIconForItem(item);
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        {!item.is_read && <View style={styles.unreadDot} />}
        <View style={styles.iconWrap}>
          <Icon size={wp(19)} color={colors.gold} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text
              style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}
            >
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{getTimeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardMessage} numberOfLines={3}>
            {item.message}
          </Text>
          {hasDeepLink(item) && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.detailsBtn}
                activeOpacity={0.8}
                onPress={() => handlePress(item)}
              >
                <Text style={styles.detailsBtnText}>Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Bell size={wp(30)} color={colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyDesc}>
        {activeTab === 'all'
          ? "You're all caught up! New notifications will appear here."
          : `No ${TABS.find(
              t => t.key === activeTab,
            )?.label.toLowerCase()} notifications yet.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(16) }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={colors.white} size={wp(24)} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
          keyExtractor={t => t.key}
          renderItem={({ item: tab }) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#F5D98F', '#D89E3F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.tabPill, styles.tabPillActive]}
                  >
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabPill}>
                    <Text style={styles.tabText}>{tab.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <CheckCheck size={wp(14)} color={'rgba(255,255,255,0.7)'} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notification List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
        />
      )}
    </View>
  );
};

export default CreatorNotification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(50),
    paddingBottom: hp(6),
  },
  backBtn: {
    position: 'absolute',
    left: wp(18),
    bottom: hp(4),
  },
  headerTitle: {
    color: colors.white,
    fontSize: fp(19),
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Tabs
  tabRow: {
    paddingTop: hp(14),
  },
  tabList: {
    paddingHorizontal: wp(16),
    gap: wp(10),
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: wp(18),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    backgroundColor: 'transparent',
  },
  tabPillActive: {
    shadowColor: '#F0C040',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  tabText: {
    fontSize: fp(13.5),
    fontWeight: '600',
    color: 'rgba(233,196,124,0.85)',
  },
  tabTextActive: {
    fontSize: fp(13.5),
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Mark all read
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: wp(16),
    marginTop: hp(12),
    gap: wp(4),
  },
  markAllText: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    paddingBottom: hp(40),
    gap: hp(12),
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1C1C1C',
    borderRadius: wp(20),
    padding: wp(16),
  },
  cardUnread: {
    backgroundColor: '#232323',
  },
  unreadDot: {
    position: 'absolute',
    top: hp(18),
    left: wp(7),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.gold,
  },
  iconWrap: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
    marginTop: hp(2),
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fp(14.5),
    fontWeight: '600',
    color: colors.white,
    flexShrink: 1,
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardMessage: {
    fontSize: fp(13),
    color: '#D9C7A3',
    marginTop: hp(4),
    lineHeight: fp(19),
  },
  cardTime: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginLeft: wp(8),
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: hp(12),
    gap: wp(10),
  },
  detailsBtn: {
    backgroundColor: colors.white,
    borderRadius: wp(10),
    paddingHorizontal: wp(18),
    paddingVertical: hp(8),
  },
  detailsBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: wp(32),
  },
  emptyIconCircle: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(36),
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  emptyTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(6),
  },
  emptyDesc: {
    fontSize: fp(13),
    color: '#D9C7A3',
    textAlign: 'center',
    lineHeight: fp(19),
  },

  // Loader
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
