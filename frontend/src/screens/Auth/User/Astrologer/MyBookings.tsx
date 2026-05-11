import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Phone,
  Video,
  MessageCircle,
  Calendar,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const UPCOMING_BOOKINGS = [
  {
    id: '1',
    astrologerName: 'Pandit Rajesh Sharma',
    specialization: 'Vedic Astrology',
    date: 'Today, 7 May',
    time: '4:00 PM',
    duration: 15,
    mode: 'call',
    amount: 225,
    status: 'confirmed',
  },
  {
    id: '2',
    astrologerName: 'Jyotish Acharya Meena Devi',
    specialization: 'Tarot Reading',
    date: 'Thu, 8 May',
    time: '11:00 AM',
    duration: 30,
    mode: 'video',
    amount: 750,
    status: 'confirmed',
  },
];

const PAST_BOOKINGS = [
  {
    id: '3',
    astrologerName: 'Guru Anand Mishra',
    specialization: 'Vastu Shastra',
    date: 'Mon, 5 May',
    time: '2:00 PM',
    duration: 20,
    mode: 'call',
    amount: 500,
    status: 'completed',
    rating: 5,
  },
  {
    id: '4',
    astrologerName: 'Acharya Priya Patel',
    specialization: 'Numerology',
    date: 'Sat, 3 May',
    time: '10:00 AM',
    duration: 15,
    mode: 'video',
    amount: 255,
    status: 'completed',
    rating: 4,
  },
  {
    id: '5',
    astrologerName: 'Pandit Suresh Kumar',
    specialization: 'Vedic Astrology',
    date: 'Wed, 30 Apr',
    time: '6:00 PM',
    duration: 30,
    mode: 'call',
    amount: 900,
    status: 'cancelled',
  },
];

const getModeIcon = (mode: string, size: number) => {
  switch (mode) {
    case 'video':
      return <Video size={size} color={colors.success} strokeWidth={1.8} />;
    case 'chat':
      return (
        <MessageCircle size={size} color={colors.secondary} strokeWidth={1.8} />
      );
    default:
      return <Phone size={size} color={colors.info} strokeWidth={1.8} />;
  }
};

const getModeLabel = (mode: string) => {
  switch (mode) {
    case 'video':
      return 'Video Call';
    case 'chat':
      return 'Chat';
    default:
      return 'Audio Call';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return colors.success;
    case 'completed':
      return colors.info;
    case 'cancelled':
      return colors.error;
    default:
      return colors.textMuted;
  }
};

const UpcomingCard = ({item}: {item: any}) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.upcomingCard}>
      <View style={styles.upcomingHeader}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>
            {item.astrologerName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>
        <View style={styles.upcomingInfo}>
          <Text style={styles.upcomingName} numberOfLines={1}>
            {item.astrologerName}
          </Text>
          <Text style={styles.upcomingSpec}>{item.specialization}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.status) + '15'},
          ]}>
          <Text
            style={[
              styles.statusText,
              {color: getStatusColor(item.status)},
            ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.upcomingDetails}>
        <View style={styles.detailItem}>
          <Calendar
            size={wp(14)}
            color={colors.textSecondary}
            strokeWidth={1.8}
          />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock
            size={wp(14)}
            color={colors.textSecondary}
            strokeWidth={1.8}
          />
          <Text style={styles.detailText}>
            {item.time} ({item.duration} min)
          </Text>
        </View>
        <View style={styles.detailItem}>
          {getModeIcon(item.mode, wp(14))}
          <Text style={styles.detailText}>{getModeLabel(item.mode)}</Text>
        </View>
      </View>

      <View style={styles.upcomingActions}>
        <Text style={styles.amountText}>Rs.{item.amount}</Text>
        <View style={styles.actionBtns}>
          {item.mode !== 'chat' && (
            <TouchableOpacity
              style={[
                styles.callBtn,
                item.mode === 'video'
                  ? {backgroundColor: colors.success}
                  : {backgroundColor: colors.info},
              ]}
              activeOpacity={0.8}
              onPress={() => {
                const callID = `astro_${item.id}_booking`;
                const userID = `user_${Date.now()}`;
                const userName = 'User';
                navigation.navigate('CallScreen', {
                  callID,
                  userID,
                  userName,
                  mode: item.mode,
                });
              }}>
              {item.mode === 'video' ? (
                <Video size={wp(16)} color={colors.white} strokeWidth={2} />
              ) : (
                <Phone size={wp(16)} color={colors.white} strokeWidth={2} />
              )}
              <Text style={styles.callBtnText}>
                {item.mode === 'video' ? 'Join Video' : 'Join Call'}
              </Text>
            </TouchableOpacity>
          )}
          {item.mode === 'chat' && (
            <TouchableOpacity
              style={[styles.callBtn, {backgroundColor: colors.secondary}]}
              activeOpacity={0.8}>
              <MessageCircle
                size={wp(16)}
                color={colors.white}
                strokeWidth={2}
              />
              <Text style={styles.callBtnText}>Start Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const PastCard = ({item}: {item: any}) => {
  return (
    <View style={styles.pastCard}>
      <View style={styles.pastHeader}>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarMiniText}>
            {item.astrologerName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>
        <View style={styles.pastInfo}>
          <Text style={styles.pastName} numberOfLines={1}>
            {item.astrologerName}
          </Text>
          <Text style={styles.pastDate}>
            {item.date} | {item.time}
          </Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={styles.pastAmount}>Rs.{item.amount}</Text>
          <View style={styles.pastModeRow}>
            {getModeIcon(item.mode, wp(12))}
            <Text style={styles.pastModeText}>{getModeLabel(item.mode)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.pastFooter}>
        <View
          style={[
            styles.statusBadgeSmall,
            {backgroundColor: getStatusColor(item.status) + '15'},
          ]}>
          <Text
            style={[
              styles.statusTextSmall,
              {color: getStatusColor(item.status)},
            ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>

        {item.status === 'completed' && item.rating && (
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={wp(11)}
                color={colors.golden}
                fill={i < item.rating ? colors.golden : 'transparent'}
                strokeWidth={1.5}
              />
            ))}
          </View>
        )}

        {item.status === 'completed' && !item.rating && (
          <TouchableOpacity style={styles.rateBtn} activeOpacity={0.7}>
            <Text style={styles.rateBtnText}>Rate Now</Text>
          </TouchableOpacity>
        )}

        {item.status === 'completed' && (
          <TouchableOpacity style={styles.rebookBtn} activeOpacity={0.7}>
            <Text style={styles.rebookBtnText}>Book Again</Text>
            <ChevronRight
              size={wp(12)}
              color={colors.secPrimary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const MyBookings: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="My Bookings" />

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.tabTextActive,
            ]}>
            Upcoming
          </Text>
          {UPCOMING_BOOKINGS.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {UPCOMING_BOOKINGS.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'upcoming' ? (
        <FlatList
          data={UPCOMING_BOOKINGS}
          renderItem={({item}) => <UpcomingCard item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: insets.bottom + hp(30)},
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Calendar
                size={wp(48)}
                color={colors.textMuted}
                strokeWidth={1}
              />
              <Text style={styles.emptyTitle}>No Upcoming Bookings</Text>
              <Text style={styles.emptyText}>
                Book an astrologer to see your upcoming sessions here.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={PAST_BOOKINGS}
          renderItem={({item}) => <PastCard item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            {paddingBottom: insets.bottom + hp(30)},
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Clock
                size={wp(48)}
                color={colors.textMuted}
                strokeWidth={1}
              />
              <Text style={styles.emptyTitle}>No Past Bookings</Text>
              <Text style={styles.emptyText}>
                Your completed sessions will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default memo(MyBookings);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: wp(16),
    marginTop: hp(14),
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(4),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    borderRadius: wp(10),
    gap: wp(6),
  },
  tabActive: {
    backgroundColor: colors.secPrimary,
  },
  tabText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.white,
    borderRadius: wp(8),
    paddingHorizontal: wp(6),
    paddingVertical: hp(1),
  },
  tabBadgeText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
  },
  upcomingCard: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    marginBottom: hp(12),
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(21),
    backgroundColor: colors.secPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  upcomingInfo: {
    marginLeft: wp(10),
    flex: 1,
  },
  upcomingName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  upcomingSpec: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  statusBadge: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  statusText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  upcomingDetails: {
    flexDirection: 'row',
    marginTop: hp(12),
    paddingTop: hp(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    gap: wp(16),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  detailText: {
    fontSize: fp(11),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  upcomingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(12),
    paddingTop: hp(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  amountText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: wp(8),
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
    borderRadius: wp(10),
  },
  callBtnText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.white,
  },
  pastCard: {
    backgroundColor: colors.white,
    borderRadius: wp(12),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(18),
    backgroundColor: colors.secPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  pastInfo: {
    marginLeft: wp(10),
    flex: 1,
  },
  pastName: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.text,
  },
  pastDate: {
    fontSize: fp(10),
    color: colors.textMuted,
    marginTop: hp(2),
  },
  pastAmount: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.text,
  },
  pastModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(2),
  },
  pastModeText: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  pastFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(10),
    paddingTop: hp(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    gap: wp(10),
  },
  statusBadgeSmall: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  statusTextSmall: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  rateBtn: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(6),
    backgroundColor: colors.golden + '20',
  },
  rateBtnText: {
    fontSize: fp(10),
    fontWeight: '600',
    color: colors.golden,
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginLeft: 'auto',
  },
  rebookBtnText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.secPrimary,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(80),
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
    paddingHorizontal: wp(40),
  },
});
