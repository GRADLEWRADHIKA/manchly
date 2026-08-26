import React, { memo, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Video, Sparkles, Bell, ArrowRight } from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getAllWebinar } from '../../../../../store/WebinarSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import ShimmerBox from '../../../../../components/ShimmerBox';

const WebinarSkeleton = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <ShimmerBox width={wp(150)} height={hp(18)} radius={6} />
        <ShimmerBox
          width={wp(210)}
          height={hp(12)}
          radius={5}
          style={{ marginTop: hp(8) }}
        />
      </View>
    </View>
    <View style={[styles.listContent, { flexDirection: 'row' }]}>
      {[0, 1, 2].map(i => (
        <View key={i} style={styles.card}>
          <ShimmerBox width={wp(160)} height={hp(90)} radius={0} />
          <View style={{ padding: wp(10) }}>
            <ShimmerBox width={wp(60)} height={hp(12)} radius={5} />
            <ShimmerBox
              width={wp(130)}
              height={hp(13)}
              radius={5}
              style={{ marginTop: hp(10) }}
            />
            <ShimmerBox
              width={wp(90)}
              height={hp(11)}
              radius={5}
              style={{ marginTop: hp(8) }}
            />
          </View>
        </View>
      ))}
    </View>
  </View>
);

const LatestWebinarItem = ({ item, onPress }: any) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item?.thumbnail_url) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [item?.thumbnail_url]);

  const iconScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const iconOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {item?.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
      ) : (
        <LinearGradient
          colors={colors.greenButtonDarkGradient || ['#4ADE80', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.thumb, styles.thumbPlaceholder]}
        >
          <Animated.View
            style={[
              styles.placeholderIconWrap,
              { transform: [{ scale: iconScale }], opacity: iconOpacity },
            ]}
          >
            <Video size={wp(22)} color="#16A34A" strokeWidth={1.8} />
          </Animated.View>
          <Text style={styles.placeholderLabel} numberOfLines={1}>
            WEBINAR
          </Text>
        </LinearGradient>
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
  const navigation = useNavigation<any>();
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
        <Pressable
          style={styles.seeAllBtn}
          onPress={() =>
            navigation.navigate('UserBottomTab', {
              screen: 'ProductsScreen',
              params: { initialTab: 'Webinars', ts: Date.now() },
            })
          }
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={wp(14)} color={colors.user.subHeading} strokeWidth={2} />
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [pressed && { opacity: 0.95 }]}>
        <LinearGradient
          colors={colors.greenButtonDarkGradient || ['#4ADE80', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyCard}
        >
          {/* Decorative background circles */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />

          <Animated.View
            style={[
              styles.emptyIconWrap,
              { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] },
            ]}
          >
            <Video size={wp(28)} color="#16A34A" strokeWidth={2} />
          </Animated.View>

          <View style={styles.sparkleRow}>
            <Sparkles size={wp(14)} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Webinars Coming Soon!</Text>
            <Sparkles size={wp(14)} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
          </View>

          <Text style={styles.emptySub}>
            Live sessions with experts are on the way.{'\n'}
            Be the first to know when they go live!
          </Text>

          <View style={styles.notifyBtn}>
            <Bell size={wp(14)} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.notifyBtnText}>Notify Me</Text>
            <ArrowRight size={wp(14)} color="#FFFFFF" strokeWidth={2} />
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
          const unbought = all.filter((w: any) => !w.is_enrolled).slice(0, 5);
          setWebinars(unbought);
        })
        .finally(() => setLoading(false));
    }
  }, [focus]);

  if (loading) {
    return <WebinarSkeleton />;
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
        <Pressable
          style={styles.seeAllBtn}
          onPress={() =>
            navigation.navigate('UserBottomTab', {
              screen: 'ProductsScreen',
              params: { initialTab: 'Webinars', ts: Date.now() },
            })
          }
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={wp(14)} color={colors.user.subHeading} strokeWidth={2} />
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
    color: colors.user.text,
  },
  sectionSubtitle: {
    fontSize: fp(12),
    color: colors.user.accentText,
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
    color: colors.user.accent,
  },
  listContent: {
    paddingHorizontal: wp(20),
    gap: wp(12),
  },
  card: {
    width: wp(160),
    backgroundColor: colors.user.card,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(6),
  },
  placeholderIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  info: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.user.text,
    lineHeight: fp(17),
    marginBottom: hp(4),
  },
  hostedBy: {
    fontSize: fp(11),
    color: colors.user.accentText,
  },
  emptyCard: {
    marginHorizontal: wp(20),
    borderRadius: wp(18),
    paddingVertical: hp(24),
    paddingHorizontal: wp(20),
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
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
    width: wp(56),
    height: wp(56),
    borderRadius: wp(28),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(12),
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(8),
  },
  emptyTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: fp(17),
    marginBottom: hp(16),
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    borderRadius: wp(20),
    gap: wp(6),
  },
  notifyBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});