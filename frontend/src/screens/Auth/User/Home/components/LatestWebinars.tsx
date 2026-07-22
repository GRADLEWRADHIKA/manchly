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
import { Video,Sparkles, Bell, ArrowRight } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getAllWebinar } from '../../../../../store/WebinarSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
//import moment from 'moment-timezone';

const LatestWebinarItem = ({ item, onPress }: any) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {item?.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Video size={wp(22)} color={colors.uSubtext} strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item?.title}
        </Text>
        <Text style={styles.hostedBy} numberOfLines={1}>
          Hosted by {item?.creator?.name || 'Instructor'}
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
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Latest Webinars</Text>
          <Text style={styles.sectionSubtitle}>
            Join live discussions with industry leaders
          </Text>
        </View>
        <Pressable style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={wp(14)} color="rgba(228, 191, 191, 0.85)" strokeWidth={2} />
        </Pressable>
      </View>
      <Pressable style={({ pressed }) => [pressed && { opacity: 0.95 }]}>
        <LinearGradient
          colors={['#2A2416', '#4A3A1A', '#0F0F0F']}
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
            <Video size={wp(30)} color={colors.gold} strokeWidth={1.8} />
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
            <Bell size={wp(14)} color={colors.uBg} strokeWidth={2} />
            <Text style={styles.notifyBtnText}>Notify Me</Text>
            <ArrowRight size={wp(14)} color={colors.uBg} strokeWidth={2} />
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
        color={colors.gold}
        style={styles.loader}
      />
    );
  }

  if (webinars.length === 0) {
    return <EmptyWebinarCard />;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Latest Webinars</Text>
          <Text style={styles.sectionSubtitle}>
            Join live discussions with industry leaders
          </Text>
        </View>
        <Pressable style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={wp(14)} color="rgba(255,255,255,0.85)" strokeWidth={2} />
        </Pressable>
      </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: wp(20),
    marginBottom: hp(14),
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(2),
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(2),
  },
  seeAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: "rgba(255,255,255,0.85)",
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
    backgroundColor: colors.uCard,
    borderRadius: wp(14),
    overflow: 'hidden',
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
    backgroundColor: colors.uSubtext,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(17),
    marginBottom: hp(4),
  },
  hostedBy: {
    fontSize: fp(11),
    color: colors.uSubHeading,
  },
  emptyCard: {
    marginHorizontal: wp(20),
    borderRadius: wp(18),
    paddingVertical: hp(30),
    paddingHorizontal: wp(24),
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  decoCircle1: {
    position: 'absolute',
    top: -wp(20),
    right: -wp(20),
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -wp(15),
    left: -wp(15),
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emptyIconWrap: {
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    backgroundColor: colors.textPrimary,
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
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: fp(12.5),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(18),
    marginBottom: hp(18),
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.uBg,
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: wp(25),
    gap: wp(8),
  },
  notifyBtnText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.uSubHeading,
  },
});