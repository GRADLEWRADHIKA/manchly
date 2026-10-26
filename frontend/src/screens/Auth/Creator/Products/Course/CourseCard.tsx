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
  ImageIcon,
  MoreVertical,
  Eye,
  UserPlus,
  TrendingUp,
  Users2,
  ArrowRight,
  FileText,
} from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { updateCourse } from '../../../../../store/CourseSlice';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { generateShareLink } from '../../../../../services/AppsFlyerService';

const CARD_BG = '#1C1B1B';
const ACCENT = '#D5C4AB';
const FREE_GREEN = '#1E4620';
const FREE_GREEN_TEXT = '#4ADE80';
const PUBLISHED_DOT = '#4ADE80';
const DRAFT_DOT = '#F5C542';
const ARCHIVED_DOT = '#EF4444';

export const formatCompactINR = (num: number) => {
  const n = Number(num) || 0;
  if (n >= 10000000)
    return `₹${(n / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `₹${n}`;
};

export const formatCompactNumber = (num: number) => {
  const n = Number(num) || 0;
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
};

// Maps a course status to a dot color + label for the status pill.
const getStatusMeta = (status: string) => {
  const normalized = (status || 'draft').toLowerCase();
  switch (normalized) {
    case 'published':
      return { dot: PUBLISHED_DOT, label: 'PUBLISHED' };
    case 'archived':
      return { dot: ARCHIVED_DOT, label: 'ARCHIVED' };
    case 'draft':
    default:
      return { dot: DRAFT_DOT, label: normalized.toUpperCase() };
  }
};

interface Props {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onAddUser: () => void;
  onStatusChange?: () => void;
}

const CourseCard: React.FC<Props> = ({
  item,
  onEdit,
  onDelete,
  onView,
  onAddUser,
  onStatusChange,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const hasThumbnail = !!(item.thumbnail_url || item.thumbnail);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);

 const isDraft = (item?.status || '').toLowerCase() === 'draft';

 const handleToggleDraft = () => {
    setStatusLoading(true);
    dispatch(
      updateCourse({
        id: item.id,
        body: { status: isDraft ? 'PUBLISHED' : 'DRAFT' },
      }),
    )
      .unwrap()
      .then(() => {
        onStatusChange?.()
      })
      .finally(() => setStatusLoading(false));
  };

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

  const goToCourse = () => navigation.navigate('CourseVideoList', { item });

  const videoCount = item.videos?.length || 0;
  const enrollmentCount = item.total_enrollments || 0;
  const revenueAmount = item.revenue || 0;
  const isFree = !item.price || Number(item.price) === 0;
  const statusMeta = getStatusMeta(item?.status);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={goToCourse}
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
              <Text style={styles.thumbnailPlaceholderText}>
                COURSE{'\n'}THUMBNAIL
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item?.title}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: isFree
                    ? FREE_GREEN
                    : 'rgba(213,196,171,0.14)',
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isFree ? FREE_GREEN_TEXT : ACCENT },
                ]}
              >
                {isFree ? 'Free' : `₹${item.price}`}
              </Text>
            </View>
            <View style={[styles.pill, styles.statusPill]}>
              <View
                style={[styles.statusDot, { backgroundColor: statusMeta.dot }]}
              />
              <Text style={styles.pillText}>{statusMeta.label}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statTopRow}>
                <Users2 size={wp(13)} color={colors.textMuted} />
                <Text style={styles.statValue}>
                  {formatCompactNumber(enrollmentCount)}
                </Text>
              </View>
              <Text style={styles.statLabel}>Users</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statTopRow}>
                <TrendingUp size={wp(13)} color={colors.textMuted} />
                <Text style={styles.statValue}>
                  {formatCompactINR(revenueAmount)}
                </Text>
              </View>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={styles.statTopRow}>
                <BookOpen size={wp(13)} color={colors.textMuted} />
                <Text style={styles.statValue}>{videoCount}</Text>
              </View>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Primary CTA — navigates to the course's video list */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={goToCourse}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowRight size={wp(16)} color={ACCENT} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* 3-dot menu — everything except the primary "go to course" action */}
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
              <MoreVertical size={wp(16)} color={colors.textMuted} />
            </TouchableOpacity>
          }
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              setTimeout(onView, 350);
            }}
          >
            <Eye size={wp(17)} color={ACCENT} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: ACCENT }]}>
              Preview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              setTimeout(handleToggleDraft, 350);
            }}
            disabled={statusLoading}
          >
            <FileText size={wp(16)} color={'#D5C4AB'} />
            <Text style={[styles.menuItemText, { color: '#D5C4AB' }]}>
              {isDraft ? 'Publish Course' : 'Draft Course'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              setTimeout(onEdit, 350);
            }}
          >
            <Edit3 size={wp(17)} color={ACCENT} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: ACCENT }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              setTimeout(handleShare, 350);
            }}
          >
            <Share2 size={wp(17)} color={colors.success} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: colors.success }]}>
              Share
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              setTimeout(onAddUser, 350);
            }}
          >
            <UserPlus size={wp(17)} color={colors.gold} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: colors.gold }]}>
              Add user
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              setTimeout(onDelete, 350);
            }}
          >
            <Trash2 size={wp(17)} color={colors.error} strokeWidth={1.8} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>
              Delete
            </Text>
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
    gap: hp(12),
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
    paddingRight: wp(28),
  },
  title: {
    fontSize: fp(15.5),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: hp(8),
  },

  // Price / status pills
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(10),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(9),
    gap: wp(5),
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusDot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
  },
  pillText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.4,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  statValue: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fp(10),
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: hp(2),
  },
  statDivider: {
    width: 1,
    height: hp(24),
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: wp(12),
  },

  // Primary CTA (arrow)
  ctaBtn: {
    position: 'absolute',
    bottom: hp(14),
    right: wp(14),
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
    borderWidth: 1.5,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3-dot menu (top-right, compact)
  menuAnchor: {
    position: 'absolute',
    top: hp(10),
    right: wp(8),
    zIndex: 100,
    elevation: 100,
  },
  moreBtn: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
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
