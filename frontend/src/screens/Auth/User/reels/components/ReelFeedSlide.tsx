import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Volume2,
  VolumeX,
  Play,
  ShoppingBag,
  BookOpen,
  Users,
} from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface ReelFeedSlideProps {
  reel: any;
  height: number;
  bottomInset?: number;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onBuy: () => void;
  onOpenCourse: () => void;
  onOpenCreator: () => void;
}

const ReelFeedSlide: React.FC<ReelFeedSlideProps> = ({
  reel,
  height,
  bottomInset = 0,
  isActive,
  muted,
  onToggleMute,
  onBuy,
  onOpenCourse,
  onOpenCreator,
}) => {
  const insets = useSafeAreaInsets();

  const course = reel.course || {};
  const creator = course.creator || {};
  const price = Number(course.price ?? 0);
  const isFree = price === 0;

  const playbackUrl =
    reel.playback_url ||
    (reel.mux_playback_id
      ? `https://stream.mux.com/${reel.mux_playback_id}.m3u8`
      : null);

  const posterUri =
    reel.thumbnail_url || course.thumbnail_url || course.thumbnail;

  return (
    <View style={[styles.slide, { height }]}>
      {/* Poster is always rendered underneath, so there is never a black flash */}
      {!!posterUri && (
        <Image
          source={{ uri: posterUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      {isActive && !!playbackUrl && (
        <Video
          source={{ uri: playbackUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          repeat
          muted={muted}
          paused={!isActive}
          playInBackground={false}
          playWhenInactive={false}
          //viewType="texture"
          onError={(e: any) =>
            console.log('REEL VIDEO ERROR', playbackUrl, JSON.stringify(e))
          }
          onLoad={() => console.log('REEL LOADED', playbackUrl)}
        />
      )}

      {/* Gradient only behind the bottom content */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.scrim}
        pointerEvents="none"
      />

      <TouchableOpacity
        onPress={onToggleMute}
        style={[styles.muteBtn, { top: insets.top + hp(12) }]}
        activeOpacity={0.8}
      >
        {muted ? (
          <VolumeX size={wp(18)} color="#FFFFFF" />
        ) : (
          <Volume2 size={wp(18)} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      <View
        style={[styles.bottomOverlay, { paddingBottom: hp(20) + bottomInset }]}
      >
        <TouchableOpacity
          onPress={onOpenCreator}
          style={styles.creatorRow}
          activeOpacity={0.8}
        >
          {creator.profile_image ? (
            <Image
              source={{ uri: creator.profile_image }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {(creator.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.creatorName}>{creator.name || 'Creator'}</Text>
        </TouchableOpacity>

        {!!reel.caption && (
          <Text style={styles.caption} numberOfLines={3}>
            {reel.caption}
          </Text>
        )}

        <View style={styles.courseStrip}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={1}>
              {course.title}
            </Text>
            <View style={styles.courseMetaRow}>
              <View style={styles.courseMetaItem}>
                <BookOpen size={wp(12)} color="rgba(255,255,255,0.7)" />
                <Text style={styles.courseMetaText}>
                  {course._count?.videos ?? 0} Videos
                </Text>
              </View>
              <View style={styles.courseMetaItem}>
                <Users size={wp(12)} color="rgba(255,255,255,0.7)" />
                <Text style={styles.courseMetaText}>
                  {course._count?.enrollments ?? 0} Users
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={reel.is_enrolled ? onOpenCourse : onBuy}
            style={styles.buyBtn}
            activeOpacity={0.85}
          >
            {reel.is_enrolled ? (
              <>
                <Play size={wp(15)} color="#FFFFFF" />
                <Text style={styles.buyBtnText}>Continue</Text>
              </>
            ) : (
              <>
                <ShoppingBag size={wp(15)} color="#FFFFFF" />
                <Text style={styles.buyBtnText}>
                  {isFree
                    ? 'Enroll free'
                    : `Buy ₹${price.toLocaleString('en-IN')}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ReelFeedSlide;

const styles = StyleSheet.create({
  slide: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  muteBtn: {
    position: 'absolute',
    right: wp(16),
    width: wp(38),
    height: wp(38),
    borderRadius: wp(19),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: wp(18),
    paddingTop: hp(18),
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(9),
    alignSelf: 'flex-start',
    marginBottom: hp(10),
  },
  avatar: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
  },
  avatarFallback: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(17),
    backgroundColor: colors.user.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fp(14),
  },
  creatorName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fp(14),
  },
  caption: {
    color: '#FFFFFF',
    fontSize: fp(14),
    lineHeight: fp(19),
    marginBottom: hp(12),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  courseStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    padding: wp(12),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  courseInfo: {
    flex: 1,
    minWidth: 0,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fp(15),
  },
  courseMetaRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginTop: hp(4),
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  courseMetaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fp(12),
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderRadius: wp(999),
    backgroundColor: colors.greenButtonDark,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fp(13.5),
  },
});