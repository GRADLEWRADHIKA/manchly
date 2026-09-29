import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Menu } from 'react-native-paper';
import {
  Clock,
  IndianRupee,
  Tag,
  Video as VideoIcon,
  Mic,
  MoreVertical,
  Eye,
  Pencil,
  UserPlus,
  Copy,
  Users,
  Trash2,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import AddUserModal from '../../../../components/AddUserModal';

const CARD_BG = '#141414';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_MUTED = 'rgba(255,255,255,0.5)';
const DANGER = '#FF5A5F';

type Props = {
  product: any;
  onPress?: () => void;
  // A menu item is only shown when its handler is passed in,
  // so there are never dead buttons in the menu.
  onPreview?: () => void;
  onEdit?: () => void;
  onAddUser?: () => void;
  onCopyLink?: () => void;
  onViewUsers?: () => void;
  onDelete?: () => void;
};

const SessionProductCard: React.FC<Props> = ({
  product,
  onPress,
  onPreview,
  onEdit,
  onAddUser,
  onCopyLink,
  onViewUsers,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const isVideo = product.mode === 'VIDEO';
  const isPaid = Number(product.price || 0) > 0;
  const isActive = !!product.is_active;
  const categories: string[] = Array.isArray(product.categories)
    ? product.categories.filter(Boolean)
    : [];
  const ModeIcon = isVideo ? VideoIcon : Mic;

  const menuItems = [
    { key: 'preview', label: 'Preview', Icon: Eye, handler: onPreview },
    { key: 'edit', label: 'Edit Session', Icon: Pencil, handler: onEdit },
    { key: 'add', label: 'Add User', Icon: UserPlus, handler: onAddUser },
    { key: 'copy', label: 'Copy Link', Icon: Copy, handler: onCopyLink },
    { key: 'users', label: 'View Users', Icon: Users, handler: onViewUsers },
    {
      key: 'delete',
      label: 'Delete Session',
      Icon: Trash2,
      handler: onDelete,
      danger: true,
    },
  ].filter(item => !!item.handler);

  const closeMenu = () => setMenuVisible(false);

  // Let the menu finish closing before running the action, so an Alert or
  // modal opened by the action doesn't collide with the menu dismissing.
  const runAction = (handler?: () => void) => () => {
    closeMenu();
    if (handler) setTimeout(handler, 300);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* Thumbnail + mode badge */}
      <View style={styles.thumbWrap}>
        {product.thumbnail_url ? (
          <Image
            source={{ uri: product.thumbnail_url }}
            style={styles.thumb}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <ModeIcon size={wp(22)} color={colors.gold} />
          </View>
        )}
        <View style={styles.modeBadge}>
          <ModeIcon size={wp(12)} color={colors.white} />
        </View>
      </View>

      {/* Details */}
      <View style={styles.info}>
        <View style={styles.pillsRow}>
          <View
            style={[
              styles.pill,
              isActive ? styles.pillActive : styles.pillDraft,
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isActive ? '#4CD964' : TEXT_MUTED },
              ]}
            />
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#4CD964' : TEXT_MUTED },
              ]}
            >
              {isActive ? 'Active' : 'Draft'}
            </Text>
          </View>

          <View style={[styles.pill, styles.pillType]}>
            <Text style={[styles.pillText, { color: colors.white }]}>
              {isPaid ? 'Paid' : 'Free'}
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          {menuItems.length > 0 && (
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              contentStyle={styles.menuContent}
              anchor={
                <TouchableOpacity
                  onPress={() => setMenuVisible(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <MoreVertical size={wp(18)} color={colors.white} />
                </TouchableOpacity>
              }
            >
              {menuItems.map(({ key, label, Icon, handler, danger }: any) => (
                <TouchableOpacity
                  key={key}
                  style={styles.menuItem}
                  onPress={runAction(handler)}
                  activeOpacity={0.7}
                >
                  <Icon size={wp(16)} color={danger ? DANGER : '#D5C4AB'} />
                  <Text
                    style={[
                      styles.menuItemText,
                      danger && { color: DANGER },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Menu>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.metaRow}>
          <Clock size={wp(13)} color={TEXT_MUTED} />
          <Text style={styles.metaText}>{product.duration} minutes</Text>
        </View>

        <View style={styles.metaRow}>
          <IndianRupee size={wp(13)} color={TEXT_MUTED} />
          <Text style={styles.metaText}>
            {isPaid ? `₹${product.price}` : 'Free'}
          </Text>
        </View>

        {categories.length > 0 && (
          <View style={styles.metaRow}>
            <Tag size={wp(13)} color={TEXT_MUTED} />
            <Text style={styles.metaText} numberOfLines={1}>
              {categories.join(', ')}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.modePill,
            isVideo ? styles.modePillVideo : styles.modePillAudio,
          ]}
        >
          <ModeIcon
            size={wp(12)}
            color={isVideo ? '#60A5FA' : colors.gold}
          />
          <Text
            style={[
              styles.modePillText,
              { color: isVideo ? '#60A5FA' : colors.gold },
            ]}
          >
            {isVideo ? 'Video Session' : 'Audio Session'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(SessionProductCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: wp(12),
    backgroundColor: CARD_BG,
    borderRadius: wp(14),
    padding: wp(12),
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  thumbWrap: {
    width: wp(72),
    height: wp(72),
  },
  thumb: {
    width: wp(72),
    height: wp(72),
    borderRadius: wp(12),
  },
  thumbPlaceholder: {
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBadge: {
    position: 'absolute',
    top: wp(4),
    right: wp(4),
    width: wp(22),
    height: wp(22),
    borderRadius: wp(6),
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    borderRadius: wp(10),
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
  },
  pillActive: { backgroundColor: 'rgba(76,217,100,0.15)' },
  pillDraft: { backgroundColor: 'rgba(255,255,255,0.08)' },
  pillType: { backgroundColor: 'rgba(255,255,255,0.1)' },
  dot: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(3),
  },
  pillText: {
    fontSize: fp(10.5),
    fontWeight: '700',
  },
  title: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: hp(8),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(6),
  },
  metaText: {
    fontSize: fp(12),
    color: TEXT_SECONDARY,
    flexShrink: 1,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp(5),
    borderRadius: wp(10),
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    marginTop: hp(10),
  },
  modePillVideo: {
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  modePillAudio: {
    backgroundColor: 'rgba(240,192,64,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(240,192,64,0.3)',
  },
  modePillText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  menuContent: {
    backgroundColor: 'rgba(26,26,26,0.97)',
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: wp(180),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  menuItemText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#D5C4AB',
  },
});