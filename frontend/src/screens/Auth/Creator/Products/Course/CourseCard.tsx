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
  Eye,
  BarChart3,
  BookOpen,
  Play,
  IndianRupee,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { createDynamicLink } from 'react-native-chottulink-sdk';

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
      toValue: 0.96,
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

  const handleShare = async () => {
    try {
      const result = await createDynamicLink({
        destinationURL: `https://manchly.chottu.link/course/${item?.id}`,
        domain: 'manchly.chottu.link',
        socialTitle: item?.title || 'Course',
        socialDescription: `Check out this course!`,
        socialImageUrl: item?.thumbnail_url || '',
      });
      Share.share({ message: result.shortURL });
    } catch {
      Share.share({
        message: `https://manchly.chottu.link/course/${item?.id}`,
      });
    }
  };

  const videoCount = item.videos?.length || 0;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['#2A2A4A', '#22335A', '#1A4A7A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onView}
          style={styles.touchable}
        >
          {/* Thumbnail with overlay */}
          <View style={styles.thumbnailWrap}>
            <Image
              source={{
                uri:
                  item.thumbnail ||
                  'https://cdn-icons-png.flaticon.com/512/4149/4149650.png',
              }}
              style={styles.thumbnail}
            />
            {/* Dark overlay on image */}
            <View style={styles.thumbnailOverlay} />

            {/* Play icon center */}
            <View style={styles.playButton}>
              <Play size={wp(14)} color={colors.white} fill={colors.white} />
            </View>

            {/* Price badge */}
            <LinearGradient
              colors={
                item.price ? ['#F97316', '#FB923C'] : ['#10B981', '#34D399']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.priceBadge}
            >
              {item.price ? (
                <IndianRupee
                  size={wp(10)}
                  color={colors.white}
                  strokeWidth={3}
                />
              ) : null}
              <Text style={styles.priceText}>
                {item.price ? `${item.price}` : 'Free'}
              </Text>
            </LinearGradient>

            {/* Level badge */}
            {item.level && (
              <View style={styles.levelBadge}>
                <BarChart3 size={wp(10)} color={'#60A5FA'} />
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Category chip */}
            {item.category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {item?.title}
            </Text>

            {/* Description */}
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <BookOpen size={wp(13)} color={'#60A5FA'} />
                <Text style={styles.statText}>
                  {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() =>
                  navigation.navigate('CourseDetailsScreen', {
                    courseId: item?.id,
                  })
                }
                activeOpacity={0.7}
              >
                <Eye size={wp(13)} color={colors.white} />
                <Text style={styles.detailsBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Separator line with glow */}
          <View style={styles.separator} />

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onEdit}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Edit3 size={wp(14)} color={'#60A5FA'} />
              </View>
              <Text style={[styles.actionText, { color: '#60A5FA' }]}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: 'rgba(16,185,129,0.15)' },
                ]}
              >
                <Share2 size={wp(14)} color={'#10B981'} />
              </View>
              <Text style={[styles.actionText, { color: '#10B981' }]}>
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: 'rgba(239,68,68,0.15)' },
                ]}
              >
                <Trash2 size={wp(14)} color={colors.error} />
              </View>
              <Text style={[styles.actionText, { color: colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: wp(16),
    marginHorizontal: wp(8),
    marginBottom: hp(14),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0F3460',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  gradient: {
    flex: 1,
    borderRadius: wp(16),
  },
  touchable: {
    flex: 1,
  },

  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(120),
    backgroundColor: '#0D1B2A',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,52,96,0.3)',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -wp(16),
    marginLeft: -wp(16),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: wp(2),
  },
  priceBadge: {
    position: 'absolute',
    top: hp(12),
    right: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    gap: wp(2),
  },
  priceText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '800',
  },
  levelBadge: {
    position: 'absolute',
    bottom: hp(12),
    left: wp(12),
    backgroundColor: 'rgba(26,26,46,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  levelText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },

  content: {
    padding: wp(12),
    flex: 1,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    marginBottom: hp(5),
  },
  categoryText: {
    color: '#60A5FA',
    fontSize: fp(9),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fp(14),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(19),
    marginBottom: hp(4),
  },
  description: {
    color: colors.white,
    fontSize: fp(11),
    lineHeight: fp(16),
    marginBottom: hp(8),
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },
  statText: {
    color: '#94A3B8',
    fontSize: fp(10),
    fontWeight: '600',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(96,165,250,0.2)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  detailsBtnText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },

  separator: {
    height: 1,
    marginHorizontal: wp(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  actionsRow: {
    flexDirection: 'row',
    paddingVertical: hp(6),
    paddingHorizontal: wp(6),
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(3),
    paddingVertical: hp(3),
  },
  actionIconWrap: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(96,165,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
});
