import React, {useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Plus,
  Star,
  Phone,
  Video,
  MessageCircle,
  Clock,
  MoreVertical,
  Users,
  IndianRupee,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeader from '../../../../components/AppHeader';

const DUMMY_ASTROLOGERS = [
  {
    id: '1',
    name: 'Pandit Rajesh Sharma',
    image: null,
    specialization: ['Vedic Astrology', 'Numerology'],
    experience: 12,
    rating: 4.8,
    totalConsultations: 1520,
    pricePerMin: 15,
    languages: ['Hindi', 'English'],
    isOnline: true,
    modes: ['call', 'video'],
  },
  {
    id: '2',
    name: 'Jyotish Acharya Meena',
    image: null,
    specialization: ['Tarot Reading', 'Palmistry'],
    experience: 8,
    rating: 4.6,
    totalConsultations: 890,
    pricePerMin: 20,
    languages: ['Hindi', 'English', 'Gujarati'],
    isOnline: false,
    modes: ['call', 'video', 'chat'],
  },
  {
    id: '3',
    name: 'Guru Anand Mishra',
    image: null,
    specialization: ['Vastu Shastra', 'KP Astrology'],
    experience: 15,
    rating: 4.9,
    totalConsultations: 2340,
    pricePerMin: 25,
    languages: ['Hindi'],
    isOnline: true,
    modes: ['call', 'video'],
  },
];

const AstrologerCard = ({item, onEdit}: {item: any; onEdit: () => void}) => {
  const [isActive, setIsActive] = useState(item.isOnline);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.avatarWrap}>
            {item.image ? (
              <Image source={{uri: item.image}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.onlineDot,
                {backgroundColor: isActive ? colors.success : colors.textMuted},
              ]}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardSpec} numberOfLines={1}>
              {item.specialization.join(' | ')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setIsActive(!isActive)}
          activeOpacity={0.7}>
          {isActive ? (
            <ToggleRight size={wp(28)} color={colors.success} strokeWidth={1.8} />
          ) : (
            <ToggleLeft
              size={wp(28)}
              color={colors.textMuted}
              strokeWidth={1.8}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Star size={wp(14)} color={colors.golden} strokeWidth={2} />
          <Text style={styles.statValue}>{item.rating}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Users size={wp(14)} color={colors.info} strokeWidth={1.8} />
          <Text style={styles.statValue}>{item.totalConsultations}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Clock size={wp(14)} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={styles.statValue}>{item.experience} yrs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <IndianRupee
            size={wp(14)}
            color={colors.success}
            strokeWidth={1.8}
          />
          <Text style={styles.statValue}>{item.pricePerMin}/min</Text>
        </View>
      </View>

      <View style={styles.modesRow}>
        {item.modes.includes('call') && (
          <View style={styles.modeTag}>
            <Phone size={wp(12)} color={colors.info} strokeWidth={1.8} />
            <Text style={styles.modeTagText}>Audio</Text>
          </View>
        )}
        {item.modes.includes('video') && (
          <View style={styles.modeTag}>
            <Video size={wp(12)} color={colors.success} strokeWidth={1.8} />
            <Text style={styles.modeTagText}>Video</Text>
          </View>
        )}
        {item.modes.includes('chat') && (
          <View style={styles.modeTag}>
            <MessageCircle
              size={wp(12)}
              color={colors.secondary}
              strokeWidth={1.8}
            />
            <Text style={styles.modeTagText}>Chat</Text>
          </View>
        )}
        <View style={{flex: 1}} />
        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.7}
          onPress={onEdit}>
          <Edit3 size={wp(14)} color={colors.info} strokeWidth={1.8} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ManageAstrologers: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const renderItem = ({item}: {item: any}) => (
    <AstrologerCard
      item={item}
      onEdit={() => navigation.navigate('CreateAstrologer', {astrologer: item})}
    />
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Astrologers" />

      <FlatList
        data={DUMMY_ASTROLOGERS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + hp(80)},
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {DUMMY_ASTROLOGERS.length}
              </Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, {color: colors.success}]}>
                {DUMMY_ASTROLOGERS.filter(a => a.isOnline).length}
              </Text>
              <Text style={styles.summaryLabel}>Online</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, {color: colors.secondary}]}>
                {DUMMY_ASTROLOGERS.reduce(
                  (sum, a) => sum + a.totalConsultations,
                  0,
                )}
              </Text>
              <Text style={styles.summaryLabel}>Bookings</Text>
            </View>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, {bottom: insets.bottom + hp(80)}]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateAstrologer')}>
        <Plus size={wp(24)} color={colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

export default memo(ManageAstrologers);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
  },
  summaryRow: {
    flexDirection: 'row',
    gap: wp(10),
    marginBottom: hp(16),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingVertical: hp(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryValue: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.info,
  },
  summaryLabel: {
    fontSize: fp(11),
    color: colors.textMuted,
    marginTop: hp(2),
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
  },
  avatarPlaceholder: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: colors.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.info,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    borderWidth: 2,
    borderColor: colors.white,
  },
  cardInfo: {
    marginLeft: wp(10),
    flex: 1,
  },
  cardName: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
  },
  cardSpec: {
    fontSize: fp(11),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  toggleBtn: {
    padding: wp(4),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(12),
    paddingTop: hp(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  statValue: {
    fontSize: fp(12),
    fontWeight: '500',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: hp(14),
    backgroundColor: colors.borderLight,
    marginHorizontal: wp(10),
  },
  modesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(10),
    gap: wp(8),
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.surface,
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  modeTagText: {
    fontSize: fp(10),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(10),
    paddingVertical: hp(6),
    borderRadius: wp(8),
    backgroundColor: colors.info + '12',
  },
  editBtnText: {
    fontSize: fp(11),
    color: colors.info,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: wp(16),
    width: wp(56),
    height: wp(56),
    borderRadius: wp(16),
    backgroundColor: colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.info,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
