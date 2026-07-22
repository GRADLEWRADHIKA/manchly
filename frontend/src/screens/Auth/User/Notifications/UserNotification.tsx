import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  CreditCard,
  Gift,
  MessageCircle,
  PhoneCall,
  Star,
  Video,
  Wifi,
  Info,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  Notification,
} from '../../../../store/NotificationSlice';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'course', label: 'Courses' },
  { key: 'session', label: 'Sessions' },
  { key: 'webinar', label: 'Webinars' },
  { key: 'system', label: 'System' },
];

const ICON_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'Course Purchased': { icon: BookOpen, color: '#3B82F6', bg: '#3B82F615' },
  'Session Reminder': { icon: Calendar, color: '#F59E0B', bg: '#F59E0B15' },
  'Expert is Online': { icon: Wifi, color: '#22C55E', bg: '#22C55E15' },
  'Webinar Starting Soon': { icon: Video, color: '#8B5CF6', bg: '#8B5CF615' },
  'New Video Added': { icon: BookOpen, color: '#3B82F6', bg: '#3B82F615' },
  'Call Summary': { icon: PhoneCall, color: '#10B981', bg: '#10B98115' },
  'Wallet Credited': { icon: CreditCard, color: '#22C55E', bg: '#22C55E15' },
  'Special Offer': { icon: Gift, color: '#EC4899', bg: '#EC489915' },
};

const TYPE_ICON: Record<string, { icon: any; color: string; bg: string }> = {
  course: { icon: BookOpen, color: '#3B82F6', bg: '#3B82F615' },
  session: { icon: PhoneCall, color: '#10B981', bg: '#10B98115' },
  webinar: { icon: Video, color: '#8B5CF6', bg: '#8B5CF615' },
  expert: { icon: Wifi, color: '#22C55E', bg: '#22C55E15' },
  system: { icon: Info, color: '#64748B', bg: '#64748B15' },
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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const UserNotification = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
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
    dispatch(getUserNotifications({}));
    return () => {
      dispatch(getUnreadCount());
    };
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getUserNotifications({}));
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

  const renderItem = ({ item }: { item: Notification }) => {
    const { icon: Icon, color, bg } = getIconForItem(item);
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        {!item.is_read && <View style={styles.unreadDot} />}
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <Icon size={wp(20)} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.cardTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Bell size={wp(32)} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyDesc}>
        {activeTab === 'all'
          ? "You're all caught up! New notifications will appear here."
          : `No ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} notifications yet.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Notifications" />

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
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <CheckCheck size={wp(14)} color={colors.secPrimary} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notification List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.secPrimary} />
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
              tintColor={colors.secPrimary}
            />
          }
        />
      )}
    </View>
  );
};

export default UserNotification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.uBg,
  },

  // Tabs
  tabRow: {
    paddingTop: hp(14),
  },
  tabList: {
    paddingHorizontal: wp(16),
    gap: wp(8),
  },
  tab: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(7),
    borderRadius: wp(20),
    backgroundColor: colors.uBg,
    borderWidth: 1,
    borderColor: colors.uBg,
  },
  tabActive: {
    backgroundColor: colors.btnGradientEnd,
    borderColor: colors.btnGradientStart,
  },
  tabText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },

  // Mark all read
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: wp(16),
    marginTop: hp(10),
    gap: wp(4),
  },
  markAllText: {
    fontSize: fp(12),
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    paddingBottom: hp(40),
    gap: hp(8),
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: colors.surface,
    elevation: 1,
    shadowColor: colors.surface,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  cardUnread: {
    backgroundColor: colors.uCard,
    borderColor: colors.uCard + '10',
  },
  unreadDot: {
    position: 'absolute',
    top: hp(16),
    left: wp(6),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: colors.textPrimary,
  },
  iconWrap: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
    marginTop: hp(2),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardMessage: {
    fontSize: fp(12),
    color: colors.uSubHeading,
    marginTop: hp(3),
    lineHeight: fp(17),
  },
  cardTime: {
    fontSize: fp(11),
    color: colors.uSubHeading,
    marginTop: hp(5),
    fontWeight: '500',
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
    backgroundColor: '#E8E0D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  emptyTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  emptyDesc: {
    fontSize: fp(13),
    color: colors.textPrimary,
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
