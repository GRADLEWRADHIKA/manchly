import React, { useRef, useState } from 'react';
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
  BarChart3,
  BookOpen,
  IndianRupee,
  PlayCircle,
  MoreVertical,
  Eye,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Menu } from 'react-native-paper';
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
  const hasThumbnail = !!(item.thumbnail_url || item.thumbnail);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => {
    setMenuVisible(false);
    setMenuKey(k => k + 1);
  };

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
        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onView}
        >
          {hasThumbnail ? (
            <View style={styles.thumbnailWrap}>
              <Image
                source={{ uri: item.thumbnail_url || item.thumbnail }}
                style={styles.thumbnail}
              />
              <View style={styles.thumbnailOverlay} />
              <View style={styles.thumbnailPriceBadge}>
                <LinearGradient
                  colors={item.price ? ['#F97316', '#FB923C'] : ['#10B981', '#34D399']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.priceBadge}
                >
                  {item.price ? (
                    <IndianRupee size={wp(9)} color={colors.white} strokeWidth={3} />
                  ) : null}
                  <Text style={styles.priceText}>
                    {item.price ? `${item.price}` : 'Free'}
                  </Text>
                </LinearGradient>
              </View>
              {item.level && (
                <View style={styles.thumbnailLevelBadge}>
                  <BarChart3 size={wp(10)} color={'#60A5FA'} />
                  <Text style={styles.levelText}>{item.level}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <PlayCircle size={wp(20)} color={'#60A5FA'} strokeWidth={1.5} />
                </View>
                <View style={styles.headerInfo}>
                  {item.category && (
                    <Text style={styles.categoryText}>{item.category}</Text>
                  )}
                  {item.level && (
                    <View style={styles.levelRow}>
                      <BarChart3 size={wp(9)} color={'#60A5FA'} />
                      <Text style={styles.levelText}>{item.level}</Text>
                    </View>
                  )}
                </View>
              </View>
              <LinearGradient
                colors={item.price ? ['#F97316', '#FB923C'] : ['#10B981', '#34D399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.priceBadge}
              >
                {item.price ? (
                  <IndianRupee size={wp(9)} color={colors.white} strokeWidth={3} />
                ) : null}
                <Text style={styles.priceText}>
                  {item.price ? `${item.price}` : 'Free'}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>
              {item?.title}
            </Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              {hasThumbnail && item.category ? (
                <View style={styles.statItem}>
                  <Text style={styles.categoryChipText}>{item.category}</Text>
                </View>
              ) : null}
              <View style={styles.statItem}>
                <BookOpen size={wp(11)} color={'#60A5FA'} />
                <Text style={styles.statText}>
                  {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 3-dot menu */}
        <View style={styles.menuAnchor}>
          <Menu
            key={menuKey}
            visible={menuVisible}
            onDismiss={closeMenu}
            contentStyle={styles.menuContent}
            anchor={
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={openMenu}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical size={wp(18)} color={'#94A3B8'} />
              </TouchableOpacity>
            }
          >
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onView, 350); }}>
              <Eye size={wp(16)} color={'#60A5FA'} />
              <Text style={[styles.menuItemText, { color: '#60A5FA' }]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onEdit, 350); }}>
              <Edit3 size={wp(16)} color={'#60A5FA'} />
              <Text style={[styles.menuItemText, { color: '#60A5FA' }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(handleShare, 350); }}>
              <Share2 size={wp(16)} color={'#10B981'} />
              <Text style={[styles.menuItemText, { color: '#10B981' }]}>Share</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onDelete, 350); }}>
              <Trash2 size={wp(16)} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </Menu>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: wp(14),
    marginHorizontal: wp(8),
    marginBottom: hp(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.12)',
  },
  gradient: {
    flex: 1,
    borderRadius: wp(14),
  },

  // Thumbnail
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: hp(120),
    borderTopLeftRadius: wp(14),
    borderTopRightRadius: wp(14),
    backgroundColor: colors.cBg,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,32,56,0.25)',
    borderTopLeftRadius: wp(14),
    borderTopRightRadius: wp(14),
  },
  thumbnailPriceBadge: {
    position: 'absolute',
    top: hp(8),
    right: wp(8),
  },
  thumbnailLevelBadge: {
    position: 'absolute',
    bottom: hp(8),
    left: wp(8),
    backgroundColor: 'rgba(30,32,56,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: 'rgba(15,52,96,0.6)',
  },

  // Icon header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(14),
    paddingTop: hp(12),
    paddingBottom: hp(2),
    paddingRight: wp(44),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  iconCircle: {
    width: wp(38),
    height: wp(38),
    borderRadius: wp(10),
    backgroundColor: 'rgba(96,165,250,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    gap: hp(2),
  },
  categoryText: {
    color: '#60A5FA',
    fontSize: fp(10),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  levelText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fp(10),
    fontWeight: '600',
  },

  // Shared
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(9),
    paddingVertical: hp(3),
    borderRadius: wp(16),
    gap: wp(2),
  },
  priceText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '800',
  },

  content: {
    paddingHorizontal: wp(14),
    paddingTop: hp(8),
    paddingBottom: hp(12),
    paddingRight: wp(44),
  },
  title: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(2),
  },
  description: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: fp(11),
    marginBottom: hp(8),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(4),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(15,52,96,0.4)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(4),
    borderRadius: wp(6),
  },
  statText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: fp(10),
    fontWeight: '600',
  },
  categoryChipText: {
    color: '#60A5FA',
    fontSize: fp(9),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 3-dot menu
  menuAnchor: {
    position: 'absolute',
    bottom: hp(10),
    right: wp(10),
    zIndex: 100,
    elevation: 100,
  },
  moreBtn: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    backgroundColor: '#16213E',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.15)',
    paddingVertical: hp(4),
    minWidth: wp(160),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
  },
  menuItemText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: wp(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
