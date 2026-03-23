import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { Calendar, Clock, User, Tag } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const WebinarCard = ({ data }) => {
  const navigation = useNavigation<any>();

  const limitToWords = (text = '') => {
    const words = text.trim().split(' ');
    if (words.length <= 3) return text;
    return words.slice(0, 3).join(' ') + '...';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        navigation.navigate('WebinarDetails', {data});
      }}
    >
      <Image
        source={{ uri: data?.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.title}>{limitToWords(data?.title)}</Text>

        <View style={styles.row}>
          <User size={wp(16)} color={colors.textSecondary} />
          <Text style={styles.creator}>{data?.creator?.name}</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={wp(16)} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {new Date(data?.scheduled_at).toDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={wp(16)} color={colors.textSecondary} />
          <Text style={styles.metaText}>{data?.duration} mins</Text>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Tag size={wp(12)} color={colors.white} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.price}>₹ {data?.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default WebinarCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(14),
    marginVertical: hp(12),
    elevation: 5,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
    borderWidth: 0.1,
    borderColor: colors.borderColor,
  },

  thumbnail: {
    width: '100%',
    height: hp(160),
    backgroundColor: colors.lightGrey,
  },

  content: {
    padding: wp(14),
  },

  title: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(6),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    gap: wp(6),
  },

  creator: {
    color: colors.textSecondary,
    fontSize: fp(14),
  },

  metaText: {
    color: colors.textSecondary,
    fontSize: fp(13),
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(6),
    marginVertical: hp(8),
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
  },

  tagText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '600',
  },

  price: {
    marginTop: hp(4),
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.primary,
  },
});
