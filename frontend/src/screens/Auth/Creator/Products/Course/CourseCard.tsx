import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import {
  Edit3,
  Trash2,
  Share2,
  Info,
  BarChart3,
  BookOpen,
} from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 60;

interface Props {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const CourseCard: React.FC<Props> = ({ item, onEdit, onDelete, onView }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation<any>();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleShare = () => {
    Share.share({
      message: `https://manchly.chottu.link/course/${item?.id}`,
    });
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ scale: scaleAnim }], width: CARD_WIDTH },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onView}
        style={styles.touchable}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          <Image
            source={{
              uri:
                item.thumbnail ||
                'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
            }}
            style={styles.thumbnail}
          />
          {/* Price badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {item.price ? `₹${item.price}` : 'Free'}
            </Text>
          </View>
          {/* Level badge */}
          {item.level && (
            <View style={styles.levelBadge}>
              <BarChart3 size={wp(10)} color={colors.white} />
              <Text style={styles.levelText}>{item.level}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category */}
          {item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {item?.title}
          </Text>

          {/* Description */}
          {item.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <TouchableOpacity
              style={styles.infoPill}
              onPress={() =>
                navigation.navigate('CourseDetailsScreen', { courseId: item?.id })
              }
              activeOpacity={0.7}
            >
              <Info size={wp(12)} color={colors.info} />
              <Text style={styles.infoPillText}>Details</Text>
            </TouchableOpacity>

            <View style={styles.metaPill}>
              <BookOpen size={wp(12)} color={colors.textSecondary} />
              <Text style={styles.metaPillText}>
                {item.videos?.length || 0} videos
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
            <Edit3 size={wp(15)} color={colors.primary} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
            <Share2 size={wp(15)} color={colors.primary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionBtn} onPress={onDelete} activeOpacity={0.7}>
            <Trash2 size={wp(15)} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(18),
    marginHorizontal: wp(8),
    marginBottom: hp(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  touchable: {
    flex: 1,
  },

  // Thumbnail
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(160),
    backgroundColor: colors.lightGrey,
  },
  priceBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    backgroundColor: colors.primary,
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  priceText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '800',
  },
  levelBadge: {
    position: 'absolute',
    bottom: hp(10),
    left: wp(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },
  levelText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },

  // Content
  content: {
    padding: wp(14),
    flex: 1,
  },
  category: {
    color: colors.info,
    fontSize: fp(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: hp(4),
  },
  title: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.text,
    lineHeight: fp(21),
    marginBottom: hp(4),
  },
  description: {
    color: colors.textSecondary,
    fontSize: fp(13),
    lineHeight: fp(18),
    marginBottom: hp(10),
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    gap: wp(8),
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: '#EEF2FF',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  infoPillText: {
    color: colors.info,
    fontSize: fp(11),
    fontWeight: '600',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.surface,
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  metaPillText: {
    color: colors.textSecondary,
    fontSize: fp(11),
    fontWeight: '600',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hp(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
  },
  actionText: {
    color: colors.primary,
    fontSize: fp(13),
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});
