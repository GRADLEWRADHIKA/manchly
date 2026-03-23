import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, Users, Play, Clock, BookOpen } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';

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
            <BookOpen size={wp(40)} color={colors.textSecondary} />
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
            <Star size={wp(14)} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Users size={wp(14)} color={colors.textSecondary} />
            <Text style={styles.metaText}>50+</Text>
          </View>
          <View style={styles.metaItem}>
            <Play size={wp(14)} color={colors.textSecondary} />
            <Text style={styles.metaText}>10+</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={wp(14)} color={colors.textSecondary} />
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
    borderRadius: wp(16),
    overflow: 'hidden',
    elevation: 3,
    marginBottom: hp(16),
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: hp(100),
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
    bottom: hp(8),
    left: wp(8),
    backgroundColor: colors.secPrimary,
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(8),
  },
  levelText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '600',
  },
  cardBody: {
    padding: wp(12),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fp(15),
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: wp(6),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: wp(4),
    fontSize: fp(12),
    color: colors.textSecondary,
  },
  instructor: {
    fontSize: fp(13),
    color: colors.textSecondary,
    marginTop: hp(4),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(6),
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(12),
    color: colors.textSecondary,
  },
  footerRow: {
    marginTop: hp(6),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
    fontSize: fp(12),
  },
  discountText: {
    fontSize: fp(12),
    color: colors.secPrimary,
  },
  priceText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.secPrimary,
    marginVertical: hp(4),
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(8),
    marginTop: hp(4),
  },
  button: {
    flex: 1,
    paddingVertical: hp(8),
    borderRadius: wp(8),
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.secPrimary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fp(13),
  },
  outlineButton: {
    borderWidth: wp(1),
    borderColor: colors.secPrimary,
    backgroundColor: colors.white,
  },
  outlineButtonText: {
    color: colors.secPrimary,
    fontWeight: '600',
    fontSize: fp(13),
  },
});
