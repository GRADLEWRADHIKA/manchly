import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Play, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

const GOLD_CREAM = '#F8DEAE';
const GOLD_DEEP = '#D69C3F';
const CARD_BG = 'rgba(28,27,27,0.70)';
const CARD_BORDER = 'rgba(255,255,255,0.05)';

const STATUS_BADGE: Record<string, { text: string; bg: string; fg: string }> = {
  READY: { text: 'Live', bg: 'rgba(34,197,94,0.14)', fg: '#22C55E' },
  HIDDEN: { text: 'Hidden', bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.6)' },
  FAILED: { text: 'Failed', bg: 'rgba(239,68,68,0.14)', fg: '#EF4444' },
  PROCESSING: { text: 'Processing', bg: 'rgba(214,156,63,0.18)', fg: GOLD_CREAM },
  UPLOADING: { text: 'Uploading', bg: 'rgba(214,156,63,0.18)', fg: GOLD_CREAM },
};

const ReelTile = ({ reel, onToggleHidden, onDelete }: any) => {
  const isLive = reel.status === 'READY';
  const isHidden = reel.status === 'HIDDEN';
  const busy = reel.status === 'UPLOADING' || reel.status === 'PROCESSING';
  const badge = STATUS_BADGE[reel.status] || STATUS_BADGE.PROCESSING;

  return (
    <View style={styles.tile}>
      <View style={styles.thumbWrap}>
        {reel.thumbnail_url ? (
          <Image source={{ uri: reel.thumbnail_url }} style={styles.thumbImage} />
        ) : (
          <View style={[styles.thumbImage, styles.thumbFallback]}>
            {busy ? (
              <Loader2 size={wp(20)} color={GOLD_CREAM} />
            ) : (
              <Play size={wp(20)} color={GOLD_CREAM} />
            )}
          </View>
        )}

        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
        </View>

        {isHidden && <View style={styles.hiddenOverlay} />}
      </View>

      <View style={styles.body}>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {reel.course?.title || 'Course'}
        </Text>
        {!!reel.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        )}

        <View style={styles.footerRow}>
          <Text style={styles.viewsText}>{reel.view_count || 0} views</Text>
          <View style={styles.actionsRow}>
            {(isLive || isHidden) && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onToggleHidden}
                activeOpacity={0.75}
              >
                {isLive ? (
                  <EyeOff size={wp(14)} color="rgba(255,255,255,0.7)" />
                ) : (
                  <Eye size={wp(14)} color="rgba(255,255,255,0.7)" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onDelete}
              activeOpacity={0.75}
            >
              <Trash2 size={wp(14)} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ReelTile;

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: wp(16),
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#0E0E0E',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,156,63,0.10)',
  },
  badge: {
    position: 'absolute',
    top: hp(8),
    left: wp(8),
    paddingHorizontal: wp(9),
    paddingVertical: hp(3),
    borderRadius: wp(14),
  },
  badgeText: {
    fontSize: fp(10),
    fontWeight: '700',
  },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  body: {
    padding: wp(10),
  },
  courseTitle: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.white,
    marginBottom: hp(3),
  },
  caption: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.55)',
    lineHeight: fp(15),
    marginBottom: hp(8),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  viewsText: {
    fontSize: fp(10.5),
    color: 'rgba(255,255,255,0.45)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: wp(6),
  },
  iconBtn: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(8),
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});