import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  Share,
} from 'react-native';
import {
  Edit3,
  Trash2,
  Share2,
  ChevronRight,
  BarChart3,
  BookOpen,
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
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Clickable main area */}
        <TouchableOpacity
          activeOpacity={0.85}
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
            <View style={styles.thumbnailOverlay} />

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
            <View style={styles.contentTop}>
              <View style={styles.contentLeft}>
                {item.category && (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
                <Text style={styles.title} numberOfLines={1}>
                  {item?.title}
                </Text>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View style={styles.arrowWrap}>
                <ChevronRight size={wp(18)} color={'#60A5FA'} />
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <BookOpen size={wp(12)} color={'#60A5FA'} />
                <Text style={styles.statText}>
                  {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Separator */}
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

          <View style={styles.actionDivider} />

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

          <View style={styles.actionDivider} />

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
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    height: hp(130),
    borderTopLeftRadius: wp(16),
    borderTopRightRadius: wp(16),
    backgroundColor: colors.cBg,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,32,56,0.25)',
    borderTopLeftRadius: wp(16),
    borderTopRightRadius: wp(16),
  },
  priceBadge: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
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
    bottom: hp(10),
    left: wp(10),
    backgroundColor: 'rgba(30,32,56,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(10),
    borderWidth: 1,
    borderColor: 'rgba(15,52,96,0.6)',
  },
  levelText: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
  },

  content: {
    padding: wp(14),
  },
  contentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  contentLeft: {
    flex: 1,
  },
  arrowWrap: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    backgroundColor: 'rgba(15,52,96,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(10),
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15,52,96,0.5)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
    marginBottom: hp(6),
  },
  categoryText: {
    color: '#60A5FA',
    fontSize: fp(9),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: fp(15),
    fontWeight: '800',
    color: colors.white,
    marginBottom: hp(2),
  },
  description: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fp(11),
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    backgroundColor: 'rgba(15,52,96,0.4)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(8),
  },
  statText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fp(10),
    fontWeight: '600',
  },

  separator: {
    height: 1,
    marginHorizontal: wp(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  actionsRow: {
    flexDirection: 'row',
    paddingVertical: hp(10),
    paddingHorizontal: wp(6),
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: wp(6),
    paddingVertical: hp(2),
  },
  actionIconWrap: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(15,52,96,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: 1,
    height: hp(24),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionText: {
    fontSize: fp(11),
    fontWeight: '700',
  },
});
