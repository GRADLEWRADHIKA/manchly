import React, { memo, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Video, Calendar, Sparkles, Bell, ArrowRight } from 'lucide-react-native';
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
      onPress={onPress}
    >
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

const EmptyWebinarCard = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Latest Webinars</Text>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.95 }]}>
        <LinearGradient
          colors={['#692626', '#8B3A3A', '#3D1515']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyCard}
        >
          {/* Decorative circles */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          <Animated.View
            style={[
              styles.emptyIconWrap,
              { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] },
            ]}
          >
            <Video size={wp(30)} color={colors.secPrimary} strokeWidth={1.8} />
          </Animated.View>

          <View style={styles.sparkleRow}>
            <Sparkles size={wp(14)} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Webinars Coming Soon!</Text>
            <Sparkles size={wp(14)} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          </View>

          <Text style={styles.emptySub}>
            Live sessions with experts are on the way.{'\n'}
            Be the first to know when they go live!
          </Text>

          <View style={styles.notifyBtn}>
            <Bell size={wp(14)} color={colors.secPrimary} strokeWidth={2} />
            <Text style={styles.notifyBtnText}>Notify Me</Text>
            <ArrowRight size={wp(14)} color={colors.secPrimary} strokeWidth={2} />
          </View>
        </LinearGradient>
      </Pressable>
    </View>
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
      dispatch(getAllWebinar({ page: 1, limit: 5, upcoming: true, title: '' }))
        .unwrap()
        .then((response: any) => {
          const all = response?.data?.data?.webinars || [];
          // console.log('---all---', all)
          const unbought = all.filter((w: any) => !w.is_enrolled).slice(0, 5);
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
    return <EmptyWebinarCard />;
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
    marginBottom: 5,
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
  emptyCard: {
    marginHorizontal: wp(20),
    borderRadius: wp(18),
    paddingVertical: hp(30),
    paddingHorizontal: wp(24),
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#692626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  decoCircle1: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -wp(15),
    left: -wp(15),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(14),
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(8),
  },
  emptyTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.white,
  },
  emptySub: {
    fontSize: fp(12.5),
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: fp(18),
    marginBottom: hp(18),
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: wp(25),
    gap: wp(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notifyBtnText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.secPrimary,
  },
});
