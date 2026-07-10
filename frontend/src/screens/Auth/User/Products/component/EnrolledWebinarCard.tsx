import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';
import { Calendar, Clock, User, Video, IndianRupee } from 'lucide-react-native';
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
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: webinar?.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{price}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {webinar?.title}
        </Text>

        {webinar?.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {webinar.description}
          </Text>
        ) : null}

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={wp(13)} color={colors.secPrimary} strokeWidth={1.8} />
            <Text style={styles.metaText}>
              {scheduledDate.format('DD MMM')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={wp(13)} color={colors.secPrimary} strokeWidth={1.8} />
            <Text style={styles.metaText}>
              {scheduledDate.format('hh:mm A')}
            </Text>
          </View>
          {webinar?.creator?.name && (
            <View style={styles.metaItem}>
              <User size={wp(13)} color={colors.secPrimary} strokeWidth={1.8} />
              <Text style={styles.metaText} numberOfLines={1}>
                {webinar.creator.name}
              </Text>
            </View>
          )}
        </View>

        {/* Join button */}
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => navigation.navigate('WebinarDetails', { data: item })}
          activeOpacity={0.8}
        >
          <Video size={wp(16)} color={colors.white} strokeWidth={2} />
          <Text style={styles.joinText}>Join Webinar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default EnrolledWebinarCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    marginBottom: hp(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(120),
    backgroundColor: '#F1F5F9',
  },
  priceBadge: {
    position: 'absolute',
    top: wp(8),
    right: wp(8),
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(8),
  },
  priceBadgeText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    padding: wp(12),
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.text,
    lineHeight: fp(20),
  },
  description: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(3),
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(12),
    marginTop: hp(8),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(11.5),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  joinBtn: {
    marginTop: hp(10),
    backgroundColor: colors.secPrimary,
    paddingVertical: hp(9),
    borderRadius: wp(10),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(6),
  },
  joinText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fp(13),
  },
});
