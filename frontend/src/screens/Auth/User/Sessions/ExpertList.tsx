import React, {useEffect, useState, memo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  Star,
  Video,
  Search,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../utils/colors';
import {wp, hp, fp} from '../../../../utils/responsive';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';
import {listExperts} from '../../../../store/SessionSlice';
import SocketService from '../../../../services/SocketService';

const CATEGORIES = ['All', 'Business Consulting', 'Career Guidance', 'Finance & Tax', 'Health & Wellness', 'Astrology', 'Technology', 'Life Coach'];

const ExpertCard = ({item, onPress}: {item: any; onPress: () => void}) => {
  const expert = item;
  const user = expert.user;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardRow}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {user?.profile_image ? (
            <Image source={{uri: user.profile_image}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user?.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
          )}
          <View style={[styles.onlineDot, {backgroundColor: expert.is_available ? colors.success : colors.textMuted}]} />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{user?.name || 'Expert'}</Text>
          <Text style={styles.cardProf} numberOfLines={1}>{expert.profession}</Text>
          <View style={styles.metaRow}>
            <Star size={wp(10)} color={colors.golden} fill={colors.golden} strokeWidth={1} />
            <Text style={styles.metaText}>{expert.rating.toFixed(1)}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{expert.experience} yrs</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{expert.total_sessions} sessions</Text>
          </View>
        </View>

        {/* Right side */}
        <View style={styles.cardRight}>
          <Text style={styles.priceText}>₹{expert.video_rate}/min</Text>
          
          {/* Gradient Book Button */}
          <View style={[styles.bookBtnWrapper, !expert.is_available && styles.bookBtnOffline]}>
            <LinearGradient
              colors={
                expert.is_available
                  ? [colors.btnGradientStart, colors.btnGradientEnd]
                  : [colors.surface, colors.surface]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtnGradient}
            >
              <Text style={[styles.bookBtnText, !expert.is_available && styles.bookBtnTextOffline]}>
                {expert.is_available ? 'Book' : 'Offline'}
              </Text>
            </LinearGradient>
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
};

const ExpertList: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const isFocused = useIsFocused();
  const {experts} = useSelector((state: any) => state.sessionReducer);
  const [searchText, setSearchText] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchExperts();
    }
  }, [isFocused, selectedCat]);

  // Listen for real-time availability changes
  useEffect(() => {
    const handler = () => {
      // Refetch on any availability change
      dispatch(
        listExperts({
          category: selectedCat === 'All' ? undefined : selectedCat,
          page: 1,
          limit: 30,
        }),
      );
    };

    SocketService.on('expert_availability_updated', handler);
    return () => {
      SocketService.off('expert_availability_updated', handler);
    };
  }, [selectedCat]);

  const fetchExperts = () => {
    setLoading(true);
    dispatch(
      listExperts({
        category: selectedCat === 'All' ? undefined : selectedCat,
        page: 1,
        limit: 30,
        search: searchText || undefined,
      }),
    ).finally(() => setLoading(false));
  };

  const handleSearch = () => fetchExperts();

  const handlePress = useCallback(
    (expert: any) => navigation.navigate('ExpertDetail', {expert}),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Session Experts" bgColor={colors.uBg} />

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0}}
        contentContainerStyle={styles.catList}>
        {CATEGORIES.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.catChip, selectedCat === item && styles.catChipActive]}
            onPress={() => setSelectedCat(item)}
            activeOpacity={0.7}>
            <Text style={[styles.catChipText, selectedCat === item && styles.catChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={wp(16)} color={colors.textMuted} strokeWidth={1.5} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or profession..."
          placeholderTextColor={colors.uSubHeading}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.secPrimary} />
        </View>
      ) : (
        <FlatList
          data={experts}
          renderItem={({item}) => <ExpertCard item={item} onPress={() => handlePress(item)} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Video size={wp(40)} color={colors.textMuted} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No experts found</Text>
              <Text style={styles.emptyText}>Check back later for available experts.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default memo(ExpertList);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.user.bg},
  catList: {paddingHorizontal: wp(16), marginTop: hp(15), paddingBottom: hp(6), gap: wp(8)},
  catChip: {
    paddingHorizontal: wp(12), paddingVertical: hp(6), borderRadius: wp(18),
    backgroundColor: colors.user.card, borderWidth: 1, borderColor: colors.user.card,
  },
  catChipActive: {backgroundColor: colors.statText, borderColor: colors.statText},
  catChipText: {fontSize: fp(11), color: colors.textPrimary, fontWeight: '500'},
  catChipTextActive: {color: colors.textPrimary, fontWeight: '600'},
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(16),
    marginTop: hp(12),
    marginBottom: hp(10),
    backgroundColor: colors.uCard,
    borderRadius: wp(12),
    paddingHorizontal: wp(12),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  searchInput: {flex: 1, fontSize: fp(13), color: colors.text, marginLeft: wp(8), paddingVertical: hp(10)},
  listContent: {paddingHorizontal: wp(16), paddingBottom: hp(30)},
  loaderWrap: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  card: {
    backgroundColor: colors.uCard,
    borderRadius: wp(12),
    padding: wp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    borderColor: colors.uCard,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {position: 'relative'},
  avatar: {width: wp(44), height: wp(44), borderRadius: wp(22)},
  avatarPlaceholder: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: colors.uSubtext,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: fp(14), fontWeight: '700', color: colors.textPrimary},
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    borderWidth: 1.5,
    borderColor: colors.uSubtext,
  },
  cardInfo: {
    marginLeft: wp(10),
    flex: 1,
  },
  cardName: {fontSize: fp(13), fontWeight: '600', color: colors.textPrimary},
  cardProf: {fontSize: fp(11), color: colors.textPrimary, marginTop: hp(1)},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(3),
    gap: wp(4),
  },
  metaText: {fontSize: fp(10), color: colors.textPrimary, fontWeight: '500'},
  metaDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(2),
    backgroundColor: colors.textPrimary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: hp(6),
    marginLeft: wp(8),
  },
  priceText: {fontSize: fp(12), fontWeight: '700', color: colors.white},
  
  // --- Updated Button Styles ---
  bookBtnWrapper: {
    borderRadius: wp(8),
    overflow: 'hidden',
  },
  bookBtnGradient: {
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnOffline: {
    borderWidth: 1,
    borderColor: colors.uSubHeading,
  },
  bookBtnText: {fontSize: fp(11), fontWeight: '600', color: colors.textPrimary},
  bookBtnTextOffline: {color: colors.textPrimary},
  // -----------------------------

  emptyWrap: {alignItems: 'center', paddingTop: hp(60), gap: hp(10)},
  emptyTitle: {fontSize: fp(16), fontWeight: '600', color: colors.textPrimary},
  emptyText: {fontSize: fp(13), color: colors.uSubHeading, textAlign: 'center', paddingHorizontal: wp(40)},
});