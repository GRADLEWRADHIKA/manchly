import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  Bell,
  BookOpen,
  CheckCheck,
  ChevronRight,
  PhoneCall,
  Video,
  Wifi,
  Info,
  Tag,
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
const GREEN = colors.greenButtonDark; // course, session, sale, expert
const PURPLE = '#7C3AED'; // webinar
const SLATE = colors.user.subHeading; // system
const BLUE = colors.user.primary;

const TYPE_META: Record<string, { icon: any; accent: string; label: string }> =
  {
    course: { icon: BookOpen, accent: GREEN, label: 'Course' },
    session: { icon: PhoneCall, accent: BLUE, label: 'Session' },
    webinar: { icon: Video, accent: PURPLE, label: 'Webinar' },
    sale: { icon: Tag, accent: colors.user.highlight, label: 'Sale' },
    expert: { icon: Wifi, accent: GREEN, label: 'Expert' },
    system: { icon: Info, accent: SLATE, label: 'System' },
  };

const getMeta = (type: string) => TYPE_META[type] || TYPE_META.system;

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

  const unreadCount = notifications.filter(
    (n: Notification) => !n.is_read,
  ).length;

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
      navigation.navigate('CourseDetailsScreen', {
        courseId: item.data.courseId,
      });
    } else if (item.data?.webinarId) {
      navigation.navigate('WebinarDetails', {
        webinarId: item.data.webinarId,
        id: item.data.webinarId,
      });
    } else if (item.data?.sessionId) {
      navigation.navigate('SessionDetails', { sessionId: item.data.sessionId });
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead()).then(() => {
      dispatch(getUnreadCount());
    });
  };

  const getActionLabel = (item: Notification): string | null => {
    if (item.data?.courseId) return 'View Course';
    if (item.data?.webinarId) return 'Join Webinar';
    if (item.data?.sessionId) return 'View Session';
    return null;
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const { icon: Icon, accent, label } = getMeta(item.type);
    const avatar =
      item.data?.avatar || item.data?.image || item.data?.thumbnail || null;
    const actionLabel = getActionLabel(item);

    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        activeOpacity={0.75}
        onPress={() => handlePress(item)}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.iconWrap}>
            <Icon size={wp(20)} color={accent} strokeWidth={2} />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <Text
              style={[styles.category, { color: accent }]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text style={styles.cardTime}>{getTimeAgo(item.createdAt)}</Text>
            {!item.is_read && (
              <View style={[styles.unreadDot, { backgroundColor: accent }]} />
            )}
          </View>

          <Text
            style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]}
            numberOfLines={3}
          >
            {item.title}
          </Text>

          {!!item.message && (
            <Text style={styles.cardMessage} numberOfLines={2}>
              {item.message}
            </Text>
          )}

          {actionLabel && (
            <View style={styles.actionRow}>
              <View
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: accent + '22',
                    borderColor: accent + '44',
                  },
                ]}
              >
                <Text style={[styles.actionText, { color: accent }]}>
                  {actionLabel}
                </Text>
                <ChevronRight size={wp(13)} color={accent} strokeWidth={2.4} />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Bell size={wp(32)} color={colors.greenButtonDark} />
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
      <AppHeaderWithBack title="Notifications" bgColor={colors.user.text} />

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
          <CheckCheck size={wp(14)} color={colors.greenButtonDark} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notification List */}
      {loading && !refreshing ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.greenButtonDark} />
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
              tintColor={colors.greenButtonDark}
              colors={[colors.greenButtonDark]}
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
    backgroundColor: colors.user.bg,
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
    paddingHorizontal: wp(18),
    paddingVertical: hp(9),
    borderRadius: wp(22),
    backgroundColor: colors.user.cardSoft,
    borderWidth: 1,
    borderColor: colors.user.border,
  },
  tabActive: {
    backgroundColor: colors.greenButtonDark,
    borderColor: colors.greenButton,
    shadowColor: colors.creatorGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.user.subHeading,
  },
  tabTextActive: {
    color: '#FFFF',
    fontWeight: '700',
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
    color: colors.greenButtonDark,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    paddingBottom: hp(40),
    gap: hp(14),
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.user.card,
    borderWidth: 1,
    borderColor: colors.user.border,
    borderRadius: wp(18),
    padding: wp(16),
  },
  cardUnread: {
    backgroundColor: colors.user.accentSoft,
    borderColor: colors.user.accent,
  },
  avatar: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    marginRight: wp(14),
    backgroundColor: colors.user.cardSoft,
  },
  iconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
    backgroundColor: colors.user.cardSoft,
  },
  cardContent: {
    flex: 1,
    minHeight: wp(48),
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  category: {
    flex: 1,
    fontSize: fp(11),
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardTime: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    fontWeight: '500',
  },
  unreadDot: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(4),
    marginLeft: wp(7),
  },
  cardTitle: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.user.text,
    lineHeight: fp(21),
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardMessage: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    marginTop: hp(4),
    lineHeight: fp(19),
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: hp(12),
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingLeft: wp(14),
    paddingRight: wp(10),
    paddingVertical: hp(7),
    borderRadius: wp(20),
    borderWidth: 1,
  },
  actionText: {
    fontSize: fp(12.5),
    fontWeight: '700',
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
    backgroundColor: colors.user.accentSoft,
    borderWidth: 1,
    borderColor: colors.user.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  emptyTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
    marginBottom: hp(6),
  },
  emptyDesc: {
    fontSize: fp(13),
    color: colors.user.subHeading,
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
