import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  BookOpen,
  X,
  ArrowLeft,
  Bookmark,
  Share2,
  Clock,
  BarChart3,
  Wallet,
  CheckCircle2,
} from 'lucide-react-native';
import colors from '../../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../../utils/responsive';

const fmtPrice = (p: any) => (Number(p) > 0 ? `₹${p}` : 'Free');

const fmtCourseDuration = (totalSeconds?: number) => {
  if (!totalSeconds) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const fmtAccessPolicy = (days?: number | null, unit?: string | null) => {
  if (!days) return 'Lifetime access';
  const unitLabel = unit ? unit.toLowerCase() : 'days';
  return `${days} ${unitLabel} access after purchase`;
};

interface Props {
  visible: boolean;
  item: any;
  onClose: () => void;
}

const CoursePreviewModal: React.FC<Props> = ({ visible, item, onClose }) => {
  if (!item) return null;

  const thumbnail = item.thumbnail_url || item.thumbnail;
  const durationLabel = fmtCourseDuration(item.total_duration);
  const accessLabel = fmtAccessPolicy(
    item.access_duration_days,
    item.access_duration_unit,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={wp(20)} color={colors.user.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity disabled hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Bookmark size={wp(19)} color={colors.user.subHeading} />
            </TouchableOpacity>
            <TouchableOpacity disabled hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: wp(14) }}>
              <Share2 size={wp(19)} color={colors.user.subHeading} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={styles.bannerWrap}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={styles.banner} />
            ) : (
              <View style={[styles.banner, styles.imgPlaceholder]}>
                <BookOpen size={wp(36)} color={colors.cAccentLight} strokeWidth={1.6} />
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {!!item.total_videos && (
              <View style={styles.metaItem}>
                <BookOpen size={wp(13)} color={colors.user.accentText} strokeWidth={1.8} />
                <Text style={styles.metaText}>{item.total_videos} Lessons</Text>
              </View>
            )}
            {!!durationLabel && (
              <View style={styles.metaItem}>
                <Clock size={wp(13)} color={colors.user.accentText} strokeWidth={1.8} />
                <Text style={styles.metaText}>{durationLabel}</Text>
              </View>
            )}
            {!!item.level && (
              <View style={styles.metaItem}>
                <BarChart3 size={wp(13)} color={colors.user.accentText} strokeWidth={1.8} />
                <Text style={styles.metaText}>{item.level}</Text>
              </View>
            )}
          </View>

          {/* Disabled Enroll button */}
          <View style={styles.previewModeBtn}>
            <Text style={styles.previewModeBtnText}>Preview Mode</Text>
          </View>

          {/* About This Course */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <BookOpen size={wp(15)} color={colors.user.nav} strokeWidth={2} />
              </View>
              <Text style={styles.infoCardTitle}>About This Course</Text>
            </View>
            <Text style={styles.infoCardBody}>
              {item.description || 'No description added yet.'}
            </Text>
          </View>

          {/* Payment & Access */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoCardIconWrap}>
                <Wallet size={wp(15)} color={colors.user.nav} strokeWidth={2} />
              </View>
              <Text style={styles.infoCardTitle}>Payment & Access</Text>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <CheckCircle2 size={wp(14)} color={colors.greenButton} strokeWidth={2} />
                <Text style={styles.bulletText}>{accessLabel}</Text>
              </View>
              <View style={styles.bulletRow}>
                <CheckCircle2 size={wp(14)} color={colors.greenButton} strokeWidth={2} />
                <Text style={styles.bulletText}>Instant access after purchase</Text>
              </View>
              <View style={styles.bulletRow}>
                <CheckCircle2 size={wp(14)} color={colors.greenButton} strokeWidth={2} />
                <Text style={styles.bulletText}>Secure payment through trusted gateways</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer: price + disabled Buy Now */}
        <View style={styles.footer}>
          <Text style={styles.footerPrice}>{fmtPrice(item.price)}</Text>
          <View style={styles.buyNowBtn}>
            <Text style={styles.buyNowBtnText}>Buy Now</Text>
          </View>
        </View>

        <Text style={styles.caption}>This is how learners see your course</Text>
      </SafeAreaView>
    </Modal>
  );
};

export default CoursePreviewModal;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.user.bg,
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
  bannerWrap: {
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: hp(180),
  },
  imgPlaceholder: {
    backgroundColor: colors.greenButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fp(19),
    fontWeight: '800',
    color: colors.user.text,
    marginHorizontal: wp(16),
    marginTop: hp(14),
  },
  metaRow: {
    flexDirection: 'row',
    gap: wp(16),
    marginHorizontal: wp(16),
    marginTop: hp(10),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(5),
  },
  metaText: {
    fontSize: fp(12),
    color: colors.user.accentText,
    fontWeight: '600',
  },
  previewModeBtn: {
    marginHorizontal: wp(16),
    marginTop: hp(16),
    height: hp(48),
    borderRadius: wp(24),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  previewModeBtnText: {
    fontSize: fp(14.5),
    fontWeight: '700',
    color: colors.user.subHeading,
  },
  infoCard: {
    backgroundColor: colors.user.card,
    borderRadius: wp(14),
    padding: wp(14),
    marginHorizontal: wp(16),
    marginTop: hp(14),
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(8),
  },
  infoCardIconWrap: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: colors.greenButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.user.text,
  },
  infoCardBody: {
    fontSize: fp(12.5),
    lineHeight: fp(18),
    color: colors.user.subHeading,
  },
  bulletList: {
    gap: hp(8),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  bulletText: {
    fontSize: fp(12.5),
    color: colors.user.subHeading,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    paddingHorizontal: wp(16),
    paddingVertical: hp(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerPrice: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.user.text,
  },
  buyNowBtn: {
    flex: 1,
    height: hp(48),
    borderRadius: wp(24),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  buyNowBtnText: {
    fontSize: fp(14.5),
    fontWeight: '700',
    color: colors.user.subHeading,
  },
  caption: {
    fontSize: fp(11.5),
    color: colors.user.subHeading,
    textAlign: 'center',
    paddingBottom: hp(10),
  },
});