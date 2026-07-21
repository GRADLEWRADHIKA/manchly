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
import SocketService from '../../../../../services/SocketService';

const TopExperts = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const [experts, setExperts] = useState<any[]>([]);

  const fetchTopExperts = () => {
    dispatch(listExperts({page: 1, limit: 5}))
      .unwrap()
      .then((res: any) => setExperts(res?.data?.experts || []));
  };

  useEffect(() => {
    fetchTopExperts();
  }, []);

  // Real-time availability updates
  useEffect(() => {
    const handler = (data: {expert_id: string; user_id: string; is_available: boolean}) => {
      if (data.is_available) {
        dispatch(listExperts({page: 1, limit: 5}))
          .unwrap()
          .then((res: any) => setExperts(res?.data?.experts || []));
      } else {
        setExperts(prev => prev.filter(e => e.id !== data.expert_id && e.user_id !== data.user_id));
      }
    };
    SocketService.on('expert_availability_updated', handler);
    return () => { SocketService.off('expert_availability_updated', handler); };
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
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {user?.name || 'Expert'}
        </Text>
        <Text style={styles.profession} numberOfLines={1}>
          {item.profession}
        </Text>
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
            color="rgba(255,255,255,0.7)"
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
    color: colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  seeAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  list: {
    paddingHorizontal: wp(16),
    gap: wp(10),
  },
  card: {
    width: wp(130),
    backgroundColor: '#1A1E38',
    borderRadius: wp(14),
    padding: wp(12),
    alignItems: 'center',
  },
  avatarWrap: {
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
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  name: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  profession: {
    fontSize: fp(10),
    color: 'rgba(255,255,255,0.6)',
    marginTop: hp(2),
    textAlign: 'center',
  },
});