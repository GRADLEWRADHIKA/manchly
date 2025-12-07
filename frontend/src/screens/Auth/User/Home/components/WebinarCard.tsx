import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { Calendar, Clock, User, Tag } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { useNavigation } from '@react-navigation/native';

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
          <User size={16} color={colors.textSecondary} />
          <Text style={styles.creator}>{data?.creator?.name}</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {new Date(data?.scheduled_at).toDateString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>{data?.duration} mins</Text>
        </View>

        <View style={styles.tagContainer}>
          {data?.tags?.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Tag size={12} color={colors.white} />
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
    borderRadius: 14,
    marginVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
    borderWidth: 0.1,
    borderColor: colors.borderColor,
  },

  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: colors.lightGrey,
  },

  content: {
    padding: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },

  creator: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  tagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  price: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
