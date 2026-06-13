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
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCreatorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from '../../../../store/NotificationSlice';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'sale', label: 'Sales' },
  { key: 'session', label: 'Sessions' },
  { key: 'webinar', label: 'Webinars' },
  { key: 'system', label: 'System' },
];

const ICON_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'New Course Purchase': {
    icon: ShoppingCart,
    color: '#3B82F6',
    bg: '#3B82F620',
  },
  'Webinar Enrollment': { icon: Users, color: '#8B5CF6', bg: '#8B5CF620' },
  'Session Booked': { icon: Calendar, color: '#10B981', bg: '#10B98120' },
  'Webinar Starting Soon': {
    icon: AlertCircle,
    color: '#F59E0B',
    bg: '#F59E0B20',
  },
  'Payout Processed': { icon: CreditCard, color: '#22C55E', bg: '#22C55E20' },
  'New Review': { icon: Star, color: '#FBBF24', bg: '#FBBF2420' },
  'KYC Approved': { icon: CheckCheck, color: '#10B981', bg: '#10B98120' },
  'New Feature Available': {
    icon: Megaphone,
    color: '#EC4899',
    bg: '#EC489920',
  },
};

const TYPE_ICON: Record<string, { icon: any; color: string; bg: string }> = {
  sale: { icon: TrendingUp, color: '#3B82F6', bg: '#3B82F620' },
  session: { icon: Calendar, color: '#10B981', bg: '#10B98120' },
  webinar: { icon: Video, color: '#8B5CF6', bg: '#8B5CF620' },
  system: { icon: Info, color: '#64748B', bg: '#64748B20' },
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
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const getIconForItem = (item: Notification) => {
    const config =
      ICON_CONFIG[item.title] || TYPE_ICON[item.type] || TYPE_ICON.system;
    return config;
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
          <Text
            style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}
          >
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
        <Bell size={wp(32)} color={colors.cTextMuted} />
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
      <AppHeaderWithBack title="Notifications" />

      {/* Tabs + Mark all read */}
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
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <CheckCheck size={wp(14)} color={'#3B82F6'} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notification List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={'#3B82F6'} />
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
              tintColor={'#3B82F6'}
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#1A1A2E',
    borderColor: '#1A1A2E',
  },
  tabText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: colors.white,
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
    color: '#3B82F6',
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
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  cardUnread: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F630',
  },
  unreadDot: {
    position: 'absolute',
    top: hp(16),
    left: wp(6),
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
    backgroundColor: '#3B82F6',
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
    color: '#1A1A2E',
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardMessage: {
    fontSize: fp(12),
    color: '#64748B',
    marginTop: hp(3),
    lineHeight: fp(17),
  },
  cardTime: {
    fontSize: fp(11),
    color: '#94A3B8',
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
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  emptyTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: hp(6),
  },
  emptyDesc: {
    fontSize: fp(13),
    color: '#64748B',
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
