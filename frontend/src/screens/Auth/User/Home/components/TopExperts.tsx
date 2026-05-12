import React, {useEffect, useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {Star, ChevronRight} from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import {wp, hp, fp} from '../../../../../utils/responsive';
import {listExperts} from '../../../../../store/SessionSlice';

const TopExperts = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const [experts, setExperts] = useState<any[]>([]);

  useEffect(() => {
    dispatch(listExperts({page: 1, limit: 5}))
      .unwrap()
      .then((res: any) => setExperts(res?.data?.experts || []));
  }, []);

  if (experts.length === 0) return null;

  const renderCard = ({item}: {item: any}) => {
    const user = item.user;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ExpertDetail', {expert: item})}>
        <View style={styles.avatarWrap}>
          {user?.profile_image ? (
            <Image source={{uri: user.profile_image}} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(user?.name || '?')
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
                backgroundColor: item.is_available
                  ? colors.success
                  : colors.textMuted,
              },
            ]}
          />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {user?.name || 'Expert'}
        </Text>
        <Text style={styles.profession} numberOfLines={1}>
          {item.profession}
        </Text>
        <View style={styles.ratingRow}>
          <Star
            size={wp(10)}
            color={colors.golden}
            fill={colors.golden}
            strokeWidth={1}
          />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.price}>₹{item.audio_rate}/min</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Experts</Text>
        <TouchableOpacity
          style={styles.seeAllBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ExpertList')}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight
            size={wp(14)}
            color={colors.secPrimary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={experts}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default memo(TopExperts);

const styles = StyleSheet.create({
  container: {
    marginTop: hp(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    marginBottom: hp(10),
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.text,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  seeAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.secPrimary,
  },
  list: {
    paddingHorizontal: wp(16),
    gap: wp(10),
  },
  card: {
    width: wp(130),
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: hp(8),
  },
  avatar: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
  },
  avatarPlaceholder: {
    width: wp(50),
    height: wp(50),
    borderRadius: wp(25),
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
    bottom: 0,
    right: 0,
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  profession: {
    fontSize: fp(10),
    color: colors.textSecondary,
    marginTop: hp(2),
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(4),
  },
  ratingText: {
    fontSize: fp(11),
    fontWeight: '600',
    color: colors.text,
  },
  price: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.info,
    marginTop: hp(4),
  },
});
