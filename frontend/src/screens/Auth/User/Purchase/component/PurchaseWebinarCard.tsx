import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Linking,
  TouchableOpacity,
} from 'react-native';
import React, { useState } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import colors from '../../../../../utils/colors';
import { Calendar, Clock, User, Video, Radio, Copy, Eye, EyeOff } from 'lucide-react-native';
import moment from 'moment-timezone';
import { wp, hp, fp } from '../../../../../utils/responsive';

const PurchaseWebinarCard = ({ item }) => {
  const webinar = item?.webinar;

  const [showCredentials, setShowCredentials] = useState(false);
  const scheduledDate = moment(webinar?.scheduled_at);
  const isUpcoming = scheduledDate.isAfter(moment());
  const isToday = scheduledDate.isSame(moment(), 'day');

  const handleCopyCredentials = () => {
    const meetingId = webinar?.zoom_meeting_id;
    const password = webinar?.zoom_password;
    if (meetingId && password) {
      Clipboard.setString(`Meeting ID: ${meetingId}\nPassword: ${password}`);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Meeting ID & Password copied to clipboard',
        position: 'bottom',
      });
    }
  };

  const handleJoin = () => {
    const meetingId = webinar?.zoom_meeting_id;
    const password = webinar?.zoom_password;
    const joinUrl = webinar?.zoom_join_url;

    if (!meetingId) return;

    // Deep link directly into the Zoom app with meeting ID + password
    const zoomAppUrl = `zoomus://zoom.us/join?confno=${meetingId}${password ? `&pwd=${password}` : ''}`;

    Linking.canOpenURL(zoomAppUrl)
      .then(supported => {
        if (supported) {
          // Zoom app is installed — open directly with credentials
          return Linking.openURL(zoomAppUrl);
        }
        // Zoom app not installed — open the web join URL (has pwd token embedded)
        if (joinUrl) {
          return Linking.openURL(joinUrl);
        }
      })
      .catch(() => {
        // Fallback to web join URL
        if (joinUrl) {
          Linking.openURL(joinUrl);
        }
      });
  };

  return (
    <View style={styles.card}>
      {/* Thumbnail with overlay badge */}
      <View style={styles.thumbnailContainer}>
        {webinar?.thumbnail_url ? (
          <Image
            source={{ uri: webinar.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Video size={wp(32)} color="#cbd5e1" strokeWidth={1.2} />
          </View>
        )}

        {/* Gradient overlay at bottom */}
        <View style={styles.thumbnailOverlay} />

        {/* Status badge on thumbnail */}
        {isToday && (
          <View style={styles.liveBadge}>
            <Radio size={wp(12)} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.liveBadgeText}>Today</Text>
          </View>
        )}

        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Clock size={wp(11)} color={colors.white} strokeWidth={2} />
          <Text style={styles.durationText}>{webinar?.duration} min</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {webinar?.title}
        </Text>

        {webinar?.tags?.length > 0 && (
          <View style={styles.tagContainer}>
            {webinar.tags.slice(0, 3).map((t, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
            {webinar.tags.length > 3 && (
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>+{webinar.tags.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Meta info row */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            {webinar?.creator?.name && (
              <View style={styles.metaItem}>
                <User
                  size={wp(14)}
                  color={colors.textSecondary}
                  strokeWidth={1.8}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {webinar.creator.name}
                </Text>
              </View>
            )}

            <View style={styles.metaItem}>
              <Calendar
                size={wp(14)}
                color={colors.secPrimary}
                strokeWidth={1.8}
              />
              <Text style={styles.metaText}>
                {isToday
                  ? `Today, ${scheduledDate.format('h:mm A')}`
                  : scheduledDate.format('DD MMM YYYY')}
              </Text>
            </View>
          </View>
        </View>

        {/* Meeting Credentials */}
        {webinar?.zoom_meeting_id && webinar?.zoom_password && (
          <View style={styles.credentialsBox}>
            <View style={styles.credentialsRow}>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Meeting ID</Text>
                <Text style={styles.credentialValue}>
                  {showCredentials ? webinar.zoom_meeting_id : '••••••••••'}
                </Text>
              </View>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Password</Text>
                <Text style={styles.credentialValue}>
                  {showCredentials ? webinar.zoom_password : '••••••••'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowCredentials(prev => !prev)}
                activeOpacity={0.7}
              >
                {showCredentials ? (
                  <EyeOff size={wp(18)} color={colors.textSecondary} />
                ) : (
                  <Eye size={wp(18)} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyCredentials}
                activeOpacity={0.7}
              >
                <Copy size={wp(16)} color={colors.secPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Paid</Text>
            <Text style={styles.price}>₹{webinar?.price}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              pressed && styles.joinBtnPressed,
              !isUpcoming && styles.joinBtnDisabled,
            ]}
            onPress={handleJoin}
            disabled={!isUpcoming}
          >
            <Video size={wp(16)} color={colors.white} strokeWidth={2} />
            <Text style={styles.joinText}>
              {isUpcoming ? 'Join Webinar' : 'Ended'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default PurchaseWebinarCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: wp(16),
    marginBottom: hp(14),
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8ecf0',
  },

  thumbnailContainer: {
    position: 'relative',
  },

  thumbnail: {
    width: '100%',
    height: hp(170),
    backgroundColor: '#f1f5f9',
  },

  thumbnailPlaceholder: {
    width: '100%',
    height: hp(140),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(50),
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  liveBadge: {
    position: 'absolute',
    top: wp(10),
    left: wp(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: '#EF4444',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(8),
  },

  liveBadgeText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '700',
  },

  durationBadge: {
    position: 'absolute',
    bottom: wp(10),
    right: wp(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: wp(8),
    paddingVertical: hp(3),
    borderRadius: wp(6),
  },

  durationText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '600',
  },

  content: {
    padding: wp(14),
  },

  title: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.text,
    lineHeight: fp(22),
  },

  tagContainer: {
    flexDirection: 'row',
    marginTop: hp(8),
    flexWrap: 'wrap',
    gap: wp(6),
  },

  tagChip: {
    backgroundColor: '#1E3A5F08',
    paddingHorizontal: wp(10),
    paddingVertical: hp(3),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: '#1E3A5F10',
  },

  tagText: {
    fontSize: fp(11),
    color: colors.secPrimary,
    fontWeight: '500',
  },

  metaSection: {
    marginTop: hp(12),
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(14),
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },

  metaText: {
    fontSize: fp(12.5),
    color: colors.textSecondary,
  },

  credentialsBox: {
    marginTop: hp(12),
    backgroundColor: '#f8fafc',
    borderRadius: wp(10),
    padding: wp(12),
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  credentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  credentialItem: {
    flex: 1,
    gap: hp(2),
  },
  credentialLabel: {
    fontSize: fp(10.5),
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialValue: {
    fontSize: fp(13),
    color: colors.text,
    fontWeight: '700',
  },
  eyeBtn: {
    padding: wp(8),
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
    backgroundColor: colors.white,
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: wp(8),
    borderWidth: 1,
    borderColor: colors.secPrimary,
  },
  copyText: {
    fontSize: fp(12),
    color: colors.secPrimary,
    fontWeight: '600',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(14),
    paddingTop: hp(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f2f5',
  },

  priceContainer: {
    gap: hp(1),
  },

  priceLabel: {
    fontSize: fp(10.5),
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  price: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.secPrimary,
  },

  joinBtn: {
    backgroundColor: colors.secPrimary,
    paddingVertical: hp(10),
    paddingHorizontal: wp(18),
    borderRadius: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
  },

  joinBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  joinBtnDisabled: {
    backgroundColor: '#94a3b8',
  },

  joinText: {
    color: colors.white,
    fontSize: fp(13.5),
    fontWeight: '600',
  },
});
