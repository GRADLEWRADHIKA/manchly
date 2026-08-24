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
  UserPlus,
} from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { generateShareLink } from '../../../../../services/AppsFlyerService';

const CARD_BG = '#1C1B1B';
const ACCENT = '#D5C4AB';

const formatDuration = (mins: number) => {
  if (!mins || mins < 1) return '0 min';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

interface Props {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onAddUser: () => void;
}

const CourseCard: React.FC<Props> = ({ item, onEdit, onDelete, onView, onAddUser }) => {
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
    const link = await generateShareLink({
      type: 'course',
      id: item?.id,
      title: item?.title || 'Course',
      description: 'Check out this course!',
      imageUrl: item?.thumbnail_url || '',
    });
    Share.share({ message: link });
  };

  const videoCount = item.videos?.length || 0;
  const statusLabel = item?.status ? String(item.status).toUpperCase() : 'DRAFT';
  const durationMins = item?.duration ?? 0;
  const createdLabel = item?.created_at || item?.createdAt
    ? new Date(item.created_at || item.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
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
              <ImageIcon size={wp(18)} color={ACCENT} strokeWidth={1.5} />
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
              <BookOpen size={wp(12)} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {videoCount} {videoCount === 1 ? 'Lesson' : 'Lessons'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={wp(12)} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatDuration(durationMins)}</Text>
            </View>
          </View>
          {createdLabel ? (
            <View style={styles.createdRow}>
              <CalendarDays size={wp(12)} color={colors.textMuted} />
              <Text style={styles.metaText}>Created on {createdLabel}</Text>
            </View>
          ) : null}
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
              <MoreVertical size={wp(18)} color={colors.textMuted} />
            </TouchableOpacity>
          }
        >
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onView, 350); }}>
            <Eye size={wp(17)} color={ACCENT} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: ACCENT }]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onEdit, 350); }}>
            <Edit3 size={wp(17)} color={ACCENT} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: ACCENT }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(handleShare, 350); }}>
            <Share2 size={wp(17)} color={colors.success} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: colors.success }]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onAddUser, 350); }}>
            <UserPlus size={wp(17)} color={colors.gold} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: colors.gold }]}>Add user</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); setTimeout(onDelete, 350); }}>
            <Trash2 size={wp(17)} color={colors.error} strokeWidth={1.8} />
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
    borderRadius: wp(20),
    marginHorizontal: wp(8),
    marginBottom: hp(12),
    backgroundColor: CARD_BG,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    padding: wp(14),
  },

  // Thumbnail
  thumbnailWrap: {
    width: wp(84),
    height: wp(84),
    borderRadius: wp(16),
    marginRight: wp(14),
    borderWidth: 1.5,
    borderColor: ACCENT,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#242220',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(4),
  },
  thumbnailPlaceholderText: {
    fontSize: fp(7.5),
    fontWeight: '700',
    color: ACCENT,
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  content: {
    flex: 1,
    paddingRight: wp(24),
  },
  title: {
    fontSize: fp(16),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: hp(8),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    marginBottom: hp(10),
  },
  priceText: {
    fontSize: fp(16.5),
    fontWeight: '800',
    color: ACCENT,
  },
  statusBadge: {
    backgroundColor: 'rgba(213,196,171,0.14)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(9),
  },
  statusText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: wp(16),
  },
  createdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    marginTop: hp(7),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  metaText: {
    fontSize: fp(11),
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
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: hp(6),
    minWidth: wp(170),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    paddingHorizontal: wp(18),
    paddingVertical: hp(12),
  },
  menuItemText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
});