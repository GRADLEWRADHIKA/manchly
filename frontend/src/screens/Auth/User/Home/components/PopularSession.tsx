import React, { memo, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Phone, Video, ChevronRight } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { getPopularSessionProducts } from '../../../../../store/SessionSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import ShimmerBox from '../../../../../components/ShimmerBox';

const ProductSkeleton = () => (
  <View style={styles.card}>
    <ShimmerBox width={wp(40)} height={wp(40)} radius={wp(10)} />
    <ShimmerBox width={wp(120)} height={hp(13)} radius={5} style={{ marginTop: hp(10) }} />
    <ShimmerBox width={wp(70)} height={hp(11)} radius={5} style={{ marginTop: hp(6) }} />
    <ShimmerBox width={wp(90)} height={hp(28)} radius={8} style={{ marginTop: hp(10) }} />
  </View>
);

const SessionProductCard = ({ item, onPress }: any) => {
  const ModeIcon = item?.mode === 'VIDEO' ? Video : Phone;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <ModeIcon size={wp(18)} color={colors.greenButtonDark} strokeWidth={2} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item?.title}
      </Text>
      <Text style={styles.duration}>{item?.duration} min</Text>
      <View style={styles.footerRow}>
        <Text style={styles.price}>
          {Number(item?.price) > 0 ? `₹${item.price}` : 'Free'}
        </Text>
        <Pressable
          disabled={!item?.expert_id}
          style={({ pressed }) => [
            styles.bookBtn,
            !item?.expert_id && styles.bookBtnDisabled,
            pressed && styles.bookBtnPressed,
          ]}
          onPress={onPress}
        >
          <Text style={styles.bookBtnText}>Book</Text>
        </Pressable>
      </View>
    </View>
  );
};

const PopularSessions = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const focus = useIsFocused();
  const { popularProducts: products, popularProductsLoading: loading } = useSelector(
    (state: any) => state.sessionReducer,
  );

  useEffect(() => {
    if (focus) {
      dispatch(getPopularSessionProducts({ limit: 6 }));
    }
  }, [focus]);

  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Popular 1:1 Sessions</Text>
          <Text style={styles.sectionSubtitle}>
            Get personalized guidance from industry experts
          </Text>
        </View>
        <Pressable style={styles.seeAllBtn} hitSlop={8}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={wp(14)} color={colors.user.subHeading} strokeWidth={2} />
        </Pressable>
      </View>

      {loading && (!products || products.length === 0) ? (
        <View style={[styles.listContent, styles.skeletonRow]}>
          {[0, 1, 2].map((i) => (
            <ProductSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={products}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item: any) => item?.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SessionProductCard
              item={item}
              onPress={() =>
                item?.expert_id &&
                navigation.navigate('ExpertDetail', { expertId: item.expert_id })
              }
            />
          )}
        />
      )}
    </View>
  );
};

export default memo(PopularSessions);

const styles = StyleSheet.create({
  section: {
    paddingTop: hp(22),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    marginBottom: hp(14),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
  },
  sectionSubtitle: {
    fontSize: fp(12),
    color: colors.user.subHeading,
    marginTop: hp(2),
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
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
  skeletonRow: {
    flexDirection: 'row',
  },
  card: {
    width: wp(150),
    backgroundColor: colors.user.card,
    borderWidth: 1,
    borderColor: colors.user.border,
    borderRadius: wp(14),
    padding: wp(12),
  },
  iconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(10),
    backgroundColor: colors.user.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.user.text,
    lineHeight: fp(17),
    marginTop: hp(10),
  },
  duration: {
    fontSize: fp(11),
    color: colors.user.subHeading,
    marginTop: hp(4),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(10),
  },
  price: {
    fontSize: fp(14),
    fontWeight: '800',
    color: colors.greenButtonDark,
  },
  bookBtn: {
    backgroundColor: colors.greenButtonDark,
    paddingHorizontal: wp(14),
    paddingVertical: hp(6),
    borderRadius: wp(8),
  },
  bookBtnDisabled: {
    opacity: 0.4,
  },
  bookBtnPressed: {
    opacity: 0.8,
  },
  bookBtnText: {
    fontSize: fp(11.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});