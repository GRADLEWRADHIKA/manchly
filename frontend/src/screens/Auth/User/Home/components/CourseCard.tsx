import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, Users, Play, Clock, BookOpen } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { useNavigation } from '@react-navigation/native';

const CourseCard = ({ item }) => {
  const navigation = useNavigation<any>();
  const image = '';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.thumbnailContainer}
        activeOpacity={0.9}
        onPress={() => {
          navigation.navigate('UserVideoList', { item: item });
        }}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <BookOpen size={40} color={colors.textSecondary} />
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{item?.course?.level}</Text>
        </View>
      </TouchableOpacity>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item?.course?.title.toUpperCase()}
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>50+</Text>
          </View>
          <View style={styles.metaItem}>
            <Play size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>10+</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>30 Min</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 100,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.secPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  cardBody: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  instructor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footerRow: {
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
    fontSize: 12,
  },
  discountText: {
    fontSize: 12,
    color: colors.secPrimary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secPrimary,
    marginVertical: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.secPrimary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.secPrimary,
    backgroundColor: colors.white,
  },
  outlineButtonText: {
    color: colors.secPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});
