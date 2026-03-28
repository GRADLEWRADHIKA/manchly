import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import { Calendar, Clock, User, Video } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';
import moment from 'moment-timezone';

const WebinarCard = ({ data }) => {
  const navigation = useNavigation<any>();
  const scheduledDate = moment(data?.scheduled_at);
  const isToday = scheduledDate.isSame(moment(), 'day');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => navigation.navigate('WebinarDetails', { data })}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailWrap}>
        {data?.thumbnail_url ? (
          <Image
            source={{ uri: data.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Video size={wp(24)} color="#cbd5e1" strokeWidth={1.2} />
          </View>
        )}

        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Clock size={wp(10)} color={colors.white} strokeWidth={2} />
          <Text style={styles.durationText}>{data?.duration} min</Text>
        </View>

        {isToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>Today</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {data?.title || 'Untitled'}
        </Text>

        <View style={styles.metaRow}>
          {data?.creator?.name && (
            <View style={styles.metaItem}>
              <User size={wp(12)} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={styles.metaText} numberOfLines={1}>
                {data.creator.name}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Calendar size={wp(12)} color={colors.secPrimary} strokeWidth={1.8} />
            <Text style={styles.metaText}>
              {isToday
                ? scheduledDate.format('h:mm A')
                : scheduledDate.format('DD MMM')}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.price}>₹{data?.price}</Text>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
    marginVertical: 10
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },

  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(120),
    backgroundColor: '#f1f5f9',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: hp(120),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: hp(6),
    right: wp(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    borderRadius: wp(5),
  },
  durationText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '600',
  },
  todayBadge: {
    position: 'absolute',
    top: hp(6),
    left: wp(6),
    backgroundColor: '#EF4444',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(5),
  },
  todayText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },

  content: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(14),
    fontWeight: '600',
    color: colors.text,
    lineHeight: fp(19),
    marginBottom: hp(6),
  },
  metaRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(8),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(11.5),
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f2f5',
  },
  price: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.secPrimary,
  },
  viewBtn: {
    backgroundColor: '#1E3A5F0A',
    paddingHorizontal: wp(14),
    paddingVertical: hp(5),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: '#1E3A5F15',
  },
  viewBtnText: {
    fontSize: fp(12),
    fontWeight: '600',
    color: colors.secPrimary,
  },
});
