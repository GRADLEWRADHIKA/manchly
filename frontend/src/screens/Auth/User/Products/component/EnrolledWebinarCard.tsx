import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';
import { Calendar, Clock, User, Video, IndianRupee, Star } from 'lucide-react-native';
import moment from 'moment-timezone';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const EnrolledWebinarCard = ({ item }) => {
  const webinar = item;
  const navigation = useNavigation<any>();

  const price =
    webinar?.price === 0 || webinar?.price === '0'
      ? 'Free'
      : `₹${webinar?.price}`;

  const scheduledDate = moment(webinar?.scheduled_at).tz(webinar?.timezone);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('WebinarDetails', { data: item })}
    >
      {/* Content (now on top) */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
          {webinar?.rating ? (
            <View style={styles.ratingRow}>
              <Star size={wp(13)} color={colors.gold} fill={colors.gold} strokeWidth={0} />
              <Text style={styles.ratingText}>{webinar.rating}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {webinar?.title}
        </Text>

        {webinar?.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {webinar.description}
          </Text>
        ) : null}

        <View style={styles.priceActionRow}>
          <View style={styles.priceGroup}>
            <Text style={styles.price}>{price}</Text>
            {webinar?.original_price ? (
              <Text style={styles.originalPrice}>₹{webinar.original_price}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate('WebinarDetails', { data: item })}
            activeOpacity={0.8}
          >
            <Text style={styles.joinText}>Enroll Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thumbnail (now on bottom) */}
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: webinar?.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
};

export default EnrolledWebinarCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.user.card,
    borderWidth: 1,
    borderColor: colors.user.border,
    borderRadius: wp(16),
    marginBottom: hp(12),
    overflow: 'hidden',
  },
  content: {
    padding: wp(14),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  featuredBadge: {
    backgroundColor: colors.user.accentSoft,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(6),
  },
  featuredBadgeText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: colors.greenButtonDark,
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  ratingText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.gold,
  },
  title: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.user.text,
    lineHeight: fp(22),
  },
  description: {
    fontSize: fp(12.5),
    color: colors.user.subHeading,
    marginTop: hp(4),
  },
  priceActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(14),
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: wp(8),
  },
  price: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.user.text,
  },
  originalPrice: {
    fontSize: fp(13),
    color: colors.user.subHeading,
    textDecorationLine: 'line-through',
  },
  joinBtn: {
    backgroundColor: colors.greenButtonDark,
    paddingVertical: hp(9),
    paddingHorizontal: wp(18),
    borderRadius: wp(10),
  },
  joinText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fp(13),
  },
  thumbnailWrap: {
    marginTop: hp(4),
  },
  thumbnail: {
    width: '100%',
    height: hp(110),
    backgroundColor: colors.user.accentSoft,
    borderBottomLeftRadius: wp(16),
    borderBottomRightRadius: wp(16),
  },
});