import React, { memo, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { Video, Calendar } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getAllWebinar } from '../../../../../store/WebinarSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import moment from 'moment-timezone';

const LatestWebinarItem = ({ item, onPress }: any) => {
  const scheduledDate = moment(item?.scheduled_at);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}>
      {item?.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Video size={wp(22)} color={colors.secPrimary} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item?.title}
        </Text>
        <View style={styles.dateRow}>
          <Calendar size={wp(11)} color={colors.secPrimary} strokeWidth={2} />
          <Text style={styles.dateText}>
            {scheduledDate.format('DD MMM, h:mm A')}
          </Text>
        </View>
        <Text style={styles.price}>
          {item?.price === 0 ? 'FREE' : `₹${item?.price}`}
        </Text>
      </View>
    </Pressable>
  );
};

const LatestWebinars = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const focus = useIsFocused();
  const [webinars, setWebinars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (focus) {
      setLoading(true);
      dispatch(getAllWebinar({ page: 1, limit: 10, upcoming: true, title: '' }))
        .unwrap()
        .then((response: any) => {
          const all = response?.data?.data?.webinars || [];
          const unbought = all
            .filter((w: any) => !w.is_enrolled)
            .slice(0, 5);
          setWebinars(unbought);
        })
        .finally(() => setLoading(false));
    }
  }, [focus]);

  if (loading) {
    return (
      <ActivityIndicator
        size="small"
        color={colors.secPrimary}
        style={styles.loader}
      />
    );
  }

  if (webinars.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Latest Webinars</Text>
      <FlatList
        data={webinars}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item?.id || item?._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <LatestWebinarItem
            item={item}
            onPress={() =>
              navigation.navigate('WebinarDetails', { data: item })
            }
          />
        )}
      />
    </View>
  );
};

export default memo(LatestWebinars);

const styles = StyleSheet.create({
  section: {
    paddingTop: hp(22),
  },
  sectionTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    color: '#1C1C1C',
    paddingHorizontal: wp(20),
    marginBottom: hp(14),
  },
  listContent: {
    paddingHorizontal: wp(20),
    gap: wp(12),
  },
  loader: {
    marginVertical: hp(20),
  },
  card: {
    width: wp(160),
    backgroundColor: colors.white,
    borderRadius: wp(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  thumb: {
    width: '100%',
    height: hp(90),
  },
  thumbPlaceholder: {
    backgroundColor: '#F7ECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#1C1C1C',
    lineHeight: fp(17),
    marginBottom: hp(4),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginBottom: hp(6),
  },
  dateText: {
    fontSize: fp(11),
    color: '#6B6059',
  },
  price: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.secPrimary,
  },
});
