import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import moment from 'moment-timezone';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  Video,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

interface Props {
  visible: boolean;
  item: any;
  onClose: () => void;
}

const fmtPrice = (p: any) => (Number(p) > 0 ? `₹${p}` : 'Free');

const WebinarPreviewModal: React.FC<Props> = ({ visible, item, onClose }) => {
  if (!item) return null;

  const scheduledMoment = item.scheduled_at ? moment(item.scheduled_at) : null;
  const durationMinutes = item.duration || 0;
  const endMoment = scheduledMoment
    ? moment(scheduledMoment).add(durationMinutes, 'minutes')
    : null;
  const hasEnded = endMoment ? moment().isAfter(endMoment) : false;
  const buttonLabel = hasEnded ? 'Webinar Ended' : 'Registrations Open';
  const platformLabel = item.zoom_meeting_id ? 'Live Webinar (Zoom)' : 'Live Webinar';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={wp(20)} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity disabled hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Bookmark size={wp(19)} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity disabled hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: wp(14) }}>
              <Share2 size={wp(19)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerBadge}>
              <Video size={wp(12)} color={colors.white} strokeWidth={2} />
              <Text style={styles.bannerBadgeText}>LIVE WEBINAR</Text>
            </View>
            <View style={styles.bannerIconWrap}>
              <Video size={wp(36)} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
            </View>
          </View>

          {/* Title + host */}
          <Text style={styles.title}>{item.title}</Text>
          {!!item.creator?.name && (
            <Text style={styles.hostedBy}>Hosted by {item.creator.name}</Text>
          )}

          <View style={styles.formatPill}>
            <Video size={wp(12)} color={colors.gold} strokeWidth={2} />
            <Text style={styles.formatPillText}>Live Webinar</Text>
          </View>

          {/* Session Details */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Session Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {scheduledMoment ? scheduledMoment.format('ddd, DD MMM YYYY') : '—'}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {item.start_time || (scheduledMoment ? scheduledMoment.format('hh:mm A') : '—')}
                {durationMinutes ? ` (${durationMinutes} mins)` : ''}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format</Text>
              <Text style={styles.detailValue}>{platformLabel}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Participants</Text>
              <Text style={styles.detailValue}>{item.max_participants ?? '—'}</Text>
            </View>
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About this webinar</Text>
          <Text style={styles.description}>
            {item.description || 'No description added yet.'}
          </Text>
        </ScrollView>

        {/* Footer: price + disabled action */}
        <View style={styles.footer}>
          <View style={styles.footerTopRow}>
            <Text style={styles.footerPrice}>{fmtPrice(item.price)}</Text>
            <TouchableOpacity disabled hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Share2 size={wp(17)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>{buttonLabel}</Text>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <ShieldCheck size={wp(13)} color={colors.textMuted} />
              <Text style={styles.trustText}>Secure Payments</Text>
            </View>
            <View style={styles.trustItem}>
              <Smartphone size={wp(13)} color={colors.textMuted} />
              <Text style={styles.trustText}>Any Device</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default WebinarPreviewModal;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.user.cardBg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
  },
  headerTitle: {
    flex: 1,
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.user.text,
    marginHorizontal: wp(10),
    textAlign: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: hp(20),
  },
  banner: {
    marginHorizontal: wp(16),
    height: hp(150),
    borderRadius: wp(16),
    backgroundColor: colors.user.accent,
    padding: wp(14),
    justifyContent: 'space-between',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    borderRadius: wp(20),
  },
  bannerBadgeText: {
    fontSize: fp(10),
    fontWeight: '800',
    color: colors.user.accentText,
    letterSpacing: 0.5,
  },
  bannerIconWrap: {
    alignSelf: 'center',
    marginBottom: hp(10),
  },
  title: {
    fontSize: fp(19),
    fontWeight: '800',
    color: colors.user.text,
    marginHorizontal: wp(16),
    marginTop: hp(14),
  },
  hostedBy: {
    fontSize: fp(13),
    color: colors.user.accent,
    fontWeight: '600',
    marginHorizontal: wp(16),
    marginTop: hp(4),
  },
  formatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(240,192,64,0.12)',
    paddingHorizontal: wp(10),
    paddingVertical: hp(5),
    borderRadius: wp(20),
    marginHorizontal: wp(16),
    marginTop: hp(10),
  },
  formatPillText: {
    fontSize: fp(11.5),
    fontWeight: '600',
    color: colors.gold,
  },
  infoCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(14),
    marginHorizontal: wp(16),
    marginTop: hp(18),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  infoCardTitle: {
    fontSize: fp(14.5),
    fontWeight: '700',
    color: colors.user.text,
    marginBottom: hp(8),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(9),
  },
  detailLabel: {
    fontSize: fp(12.5),
    color: colors.user.subHeading,
  },
  detailValue: {
    fontSize: fp(12.5),
    fontWeight: '700',
    color: colors.user.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.user.subHeading,
  },
  sectionTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.user.text,
    marginHorizontal: wp(16),
    marginTop: hp(20),
    marginBottom: hp(6),
  },
  description: {
    fontSize: fp(12.5),
    lineHeight: fp(18),
    color: colors.user.subHeading,
    marginHorizontal: wp(16),
  },
  footer: {
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    paddingBottom: hp(14),
    borderTopWidth: 1,
    borderTopColor: colors.user.text,
  },
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  footerPrice: {
    fontSize: fp(20),
    fontWeight: '800',
    color: colors.user.accent,
  },
  actionBtn: {
    height: hp(48),
    borderRadius: wp(24),
    backgroundColor: colors.greenButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.greenButton,
  },
  actionBtnText: {
    fontSize: fp(14.5),
    fontWeight: '700',
    color: colors.user.text,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(24),
    marginTop: hp(12),
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  trustText: {
    fontSize: fp(10.5),
    color: colors.user.subHeading,
    fontWeight: '500',
  },
});