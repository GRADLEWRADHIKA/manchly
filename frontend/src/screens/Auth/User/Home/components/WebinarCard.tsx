import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import {  Video } from 'lucide-react-native';
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
            <Video size={wp(24)} color={colors.textMuted} strokeWidth={1.2} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {data?.title || 'Untitled'}
        </Text>

        {data?.creator?.name && (
          <Text style={styles.hostedBy} numberOfLines={1}>
            Hosted by {data.creator.name}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    width: wp(160),
    backgroundColor: colors.surface,
    borderRadius: wp(14),
    overflow: 'hidden',
    marginVertical: 10,
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
    height: hp(90),
    backgroundColor: colors.inputBg,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: hp(90),
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: wp(10),
  },
  title: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: fp(18),
    marginBottom: hp(4),
  },
  hostedBy: {
    fontSize: fp(11),
    color: colors.textSecondary,
  },
});