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
  BookOpen,
  Clock,
  CalendarDays,
  ImageIcon,
  MoreVertical,
  Eye,
} from 'lucide-react-native';
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
  const statusLabel = item?.status ? String(item.status).toUpperCase() : 'DRAFT';
  const durationMins = item?.duration ?? 0;
  const createdLabel = item?.created_at || item?.createdAt
    ? new Date(item.created_at || item.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onView}
        style={styles.row}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailWrap}>
          {hasThumbnail ? (
            <Image
              source={{ uri: item.thumbnail_url || item.thumbnail }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <ImageIcon size={wp(18)} color={colors.gold} strokeWidth={1.5} />
              <Text style={styles.thumbnailPlaceholderText}>COURSE{'\n'}THUMBNAIL</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item?.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              {item.price ? `₹${item.price}` : 'Free'}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BookOpen size={wp(11)} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {videoCount} {videoCount === 1 ? 'Lesson' : 'Lessons'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={wp(11)} color={colors.textMuted} />
              <Text style={styles.metaText}>{durationMins} min</Text>
            </View>
            {createdLabel ? (
              <View style={styles.metaItem}>
                <CalendarDays size={wp(11)} color={colors.textMuted} />
                <Text style={styles.metaText}>Created {createdLabel}</Text>
              </View>
            ) : null}
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
              <MoreVertical size={wp(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          }
        >
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onView, 350); }}>
            <Eye size={wp(16)} color={colors.textSecondary} />
            <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onEdit, 350); }}>
            <Edit3 size={wp(16)} color={colors.textSecondary} />
            <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(handleShare, 350); }}>
            <Share2 size={wp(16)} color={colors.success} />
            <Text style={[styles.menuItemText, { color: colors.success }]}>Share</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onDelete, 350); }}>
            <Trash2 size={wp(16)} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </Menu>
      </View>
    </Animated.View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: wp(14),
    marginHorizontal: wp(8),
    marginBottom: hp(12),
    backgroundColor: colors.cCard,
    borderWidth: 1,
    borderColor: colors.cBorder,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    padding: wp(12),
  },

  // Thumbnail
  thumbnailWrap: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(10),
    marginRight: wp(12),
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: wp(10),
    backgroundColor: colors.inputBg,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: wp(10),
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.golden,
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(4),
  },
  thumbnailPlaceholderText: {
    fontSize: fp(7),
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  content: {
    flex: 1,
    paddingRight: wp(24),
  },
  title: {
    fontSize: fp(14.5),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(8),
  },
  priceText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: colors.goldDim,
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6),
  },
  statusText: {
    fontSize: fp(9.5),
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: wp(12),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(10.5),
    color: colors.textMuted,
    fontWeight: '500',
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
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    backgroundColor: colors.cSurface,
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: colors.cBorder,
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
    backgroundColor: colors.border,
  },
});