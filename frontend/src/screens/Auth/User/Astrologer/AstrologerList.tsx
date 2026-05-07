import React, {useState, memo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Star,
  Phone,
  Video,
  MessageCircle,
  Clock,
  Search,
  Filter,
  IndianRupee,
  ChevronRight,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const CATEGORIES = [
  'All',
  'Vedic',
  'Tarot',
  'Numerology',
  'Palmistry',
  'Vastu',
  'KP',
];

const ASTROLOGERS = [
  {
    id: '1',
    name: 'Pandit Rajesh Sharma',
    image: null,
    specialization: ['Vedic Astrology', 'Numerology'],
    experience: 12,
    rating: 4.8,
    reviews: 320,
    totalConsultations: 1520,
    pricePerMin: 15,
    languages: ['Hindi', 'English'],
    isOnline: true,
    modes: ['call', 'video'],
    nextAvailable: 'Available now',
  },
  {
    id: '2',
    name: 'Jyotish Acharya Meena Devi',
    image: null,
    specialization: ['Tarot Reading', 'Palmistry'],
    experience: 8,
    rating: 4.6,
    reviews: 210,
    totalConsultations: 890,
    pricePerMin: 20,
    languages: ['Hindi', 'English', 'Gujarati'],
    isOnline: true,
    modes: ['call', 'video', 'chat'],
    nextAvailable: 'Available now',
  },
  {
    id: '3',
    name: 'Guru Anand Mishra',
    image: null,
    specialization: ['Vastu Shastra', 'KP Astrology'],
    experience: 15,
    rating: 4.9,
    reviews: 540,
    totalConsultations: 2340,
    pricePerMin: 25,
    languages: ['Hindi'],
    isOnline: false,
    modes: ['call', 'video'],
    nextAvailable: 'Next: 3:00 PM',
  },
  {
    id: '4',
    name: 'Acharya Priya Patel',
    image: null,
    specialization: ['Numerology', 'Face Reading'],
    experience: 6,
    rating: 4.5,
    reviews: 150,
    totalConsultations: 670,
    pricePerMin: 12,
    languages: ['Hindi', 'English', 'Marathi'],
    isOnline: true,
    modes: ['call', 'chat'],
    nextAvailable: 'Available now',
  },
  {
    id: '5',
    name: 'Pandit Suresh Kumar',
    image: null,
    specialization: ['Vedic Astrology', 'Horoscope'],
    experience: 20,
    rating: 4.9,
    reviews: 890,
    totalConsultations: 4200,
    pricePerMin: 30,
    languages: ['Hindi', 'English'],
    isOnline: false,
    modes: ['call', 'video'],
    nextAvailable: 'Next: 5:00 PM',
  },
];

const AstrologerCard = ({
  item,
  onPress,
}: {
  item: any;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}>
      <View style={styles.cardTop}>
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
              {
                backgroundColor: item.isOnline
                  ? colors.success
                  : colors.textMuted,
              },
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
          <View style={styles.ratingRow}>
            <Star
              size={wp(12)}
              color={colors.golden}
              fill={colors.golden}
              strokeWidth={1}
            />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewText}>({item.reviews} reviews)</Text>
            <View style={styles.expBadge}>
              <Clock
                size={wp(10)}
                color={colors.textSecondary}
                strokeWidth={1.8}
              />
              <Text style={styles.expText}>{item.experience} yrs</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.priceRow}>
          <IndianRupee size={wp(13)} color={colors.success} strokeWidth={2} />
          <Text style={styles.priceText}>{item.pricePerMin}/min</Text>
        </View>

        <View style={styles.modesRow}>
          {item.modes.includes('call') && (
            <View style={[styles.modeIcon, {backgroundColor: colors.info + '15'}]}>
              <Phone size={wp(13)} color={colors.info} strokeWidth={1.8} />
            </View>
          )}
          {item.modes.includes('video') && (
            <View
              style={[styles.modeIcon, {backgroundColor: colors.success + '15'}]}>
              <Video size={wp(13)} color={colors.success} strokeWidth={1.8} />
            </View>
          )}
          {item.modes.includes('chat') && (
            <View
              style={[
                styles.modeIcon,
                {backgroundColor: colors.secondary + '15'},
              ]}>
              <MessageCircle
                size={wp(13)}
                color={colors.secondary}
                strokeWidth={1.8}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.bookBtn,
            !item.isOnline && styles.bookBtnOffline,
          ]}
          activeOpacity={0.8}
          onPress={onPress}>
          <Text
            style={[
              styles.bookBtnText,
              !item.isOnline && styles.bookBtnTextOffline,
            ]}>
            {item.isOnline ? 'Book Now' : item.nextAvailable}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.langRow}>
        <Text style={styles.langText}>
          {item.languages.join(' | ')}
        </Text>
        <Text style={styles.consultText}>
          {item.totalConsultations}+ consultations
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const AstrologerList: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handlePress = useCallback(
    (astrologer: any) => {
      navigation.navigate('AstrologerDetail', {astrologer});
    },
    [navigation],
  );

  const renderItem = ({item}: {item: any}) => (
    <AstrologerCard item={item} onPress={() => handlePress(item)} />
  );

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Astrologers" />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={wp(18)} color={colors.textMuted} strokeWidth={1.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search astrologers..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <Filter
            size={wp(18)}
            color={colors.secPrimary}
            strokeWidth={1.8}
          />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.catChip,
              selectedCategory === item && styles.catChipActive,
            ]}
            onPress={() => setSelectedCategory(item)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.catChipText,
                selectedCategory === item && styles.catChipTextActive,
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item}
      />

      {/* List */}
      <FlatList
        data={ASTROLOGERS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + hp(30)},
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default memo(AstrologerList);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchWrap: {
    flexDirection: 'row',
    paddingHorizontal: wp(16),
    paddingTop: hp(14),
    gap: wp(10),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: fp(14),
    color: colors.text,
    marginLeft: wp(8),
    paddingVertical: hp(10),
  },
  filterBtn: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  catList: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    gap: wp(8),
  },
  catChip: {
    paddingHorizontal: wp(14),
    paddingVertical: hp(6),
    borderRadius: wp(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  catChipActive: {
    backgroundColor: colors.secPrimary,
    borderColor: colors.secPrimary,
  },
  catChipText: {
    fontSize: fp(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  catChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: wp(16),
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(27),
  },
  avatarPlaceholder: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(27),
    backgroundColor: colors.secPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: wp(2),
    right: wp(2),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    borderWidth: 2,
    borderColor: colors.white,
  },
  cardInfo: {
    marginLeft: wp(12),
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(4),
    gap: wp(4),
  },
  ratingText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.text,
  },
  reviewText: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginLeft: wp(6),
    backgroundColor: colors.surface,
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  expText: {
    fontSize: fp(10),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(12),
    paddingTop: hp(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  priceText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.success,
  },
  modesRow: {
    flexDirection: 'row',
    gap: wp(6),
    marginLeft: wp(12),
    flex: 1,
  },
  modeIcon: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtn: {
    backgroundColor: colors.secPrimary,
    borderRadius: wp(10),
    paddingHorizontal: wp(14),
    paddingVertical: hp(8),
  },
  bookBtnOffline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secPrimary,
  },
  bookBtnText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.white,
  },
  bookBtnTextOffline: {
    color: colors.secPrimary,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(8),
  },
  langText: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
  consultText: {
    fontSize: fp(10),
    color: colors.textMuted,
  },
});
