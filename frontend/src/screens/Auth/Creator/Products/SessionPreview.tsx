import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Briefcase,
  User as UserIcon,
  Calendar,
  Clock,
  Timer,
  Video,
  Mic,
  CreditCard,
  ShieldCheck,
} from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';

const U = colors.user;
const GST_RATE = 0.18; // from the design
const PLATFORM_RATE = 0.02; // from the design

const money = (n: number) => `₹${n.toFixed(2)}`;

const Row = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Icon size={wp(16)} color={U.icon} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const SessionPreview: React.FC = () => {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const insets = useSafeAreaInsets();
  const product = params?.data;
  const { user } = useSelector((state: any) => state.userReducer);
  const { expertProfile } = useSelector((state: any) => state.sessionReducer);

  if (!product) return null;

  const isVideo = product.mode === 'VIDEO';
  const ModeIcon = isVideo ? Video : Mic;
  const price = Number(product.price || 0);
  const gst = price * GST_RATE;
  const platform = price * PLATFORM_RATE;
  const total = price + gst + platform;
  const categories: string[] = Array.isArray(product.categories)
    ? product.categories.filter(Boolean)
    : [];

  // Expert info — see note below about field names.
  const expertName = user?.name;
  const expertImage = user?.profile_image;
  const expertBio = expertProfile?.bio;
  const expertExperience = expertProfile?.experience;

  const banner = (
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerTitle} numberOfLines={3}>
        {product.title}
      </Text>
      {!!product.description && (
        <Text style={styles.bannerSub} numberOfLines={2}>
          {product.description}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + hp(8) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={wp(22)} color={U.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: wp(22) }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        {product.thumbnail_url ? (
          <ImageBackground
            source={{ uri: product.thumbnail_url }}
            style={styles.banner}
            imageStyle={styles.bannerImg}
          >
            {banner}
          </ImageBackground>
        ) : (
          <View style={[styles.banner, { backgroundColor: colors.trackDark }]}>
            {banner}
          </View>
        )}

        {/* Expert card */}
        <View style={styles.card}>
          <View style={styles.expertTop}>
            {expertImage ? (
              <Image source={{ uri: expertImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <UserIcon size={wp(30)} color={U.subHeading} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {!!expertName && (
                <Text style={styles.expertName}>{expertName}</Text>
              )}
              {!!expertBio && (
                <Text style={styles.expertBio} numberOfLines={3}>
                  {expertBio}
                </Text>
              )}
            </View>
          </View>

          {(categories.length > 0 || !!expertExperience) && (
            <View style={styles.expertMeta}>
              {categories.length > 0 && (
                <View style={styles.metaCell}>
                  <Briefcase size={wp(20)} color={U.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Category</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {categories.join(', ')}
                    </Text>
                  </View>
                </View>
              )}
              {categories.length > 0 && !!expertExperience && (
                <View style={styles.metaDivider} />
              )}
              {!!expertExperience && (
                <View style={styles.metaCell}>
                  <UserIcon size={wp(20)} color={U.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaLabel}>Experience</Text>
                    <Text style={styles.metaValue}>{expertExperience}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Session details */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Calendar size={wp(16)} color={U.accent} />
            <Text style={styles.sectionTitle}>Session Details</Text>
          </View>
          <Row icon={Calendar} label="Date" value="Chosen at booking" />
          <Row icon={Clock} label="Time" value="Chosen at booking" />
          <Row
            icon={Timer}
            label="Duration"
            value={`${product.duration} Minutes`}
          />
          <Row
            icon={ModeIcon}
            label="Session Type"
            value={isVideo ? 'Video Call' : 'Audio Call'}
          />
        </View>

        {/* Payment details */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <CreditCard size={wp(16)} color={U.accent} />
            <Text style={styles.sectionTitle}>Payment Details</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>
              Session Fee ({product.duration} minutes)
            </Text>
            <Text style={styles.payValue}>{money(price)}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>GST (18%)</Text>
            <Text style={styles.payValue}>{money(gst)}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Platform Fee (2%)</Text>
            <Text style={styles.payValue}>{money(platform)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{money(total)}</Text>
          </View>
        </View>

        <View style={styles.secureRow}>
          <ShieldCheck size={wp(15)} color={U.accent} />
          <Text style={styles.secureText}>
            Secure session. Billed per session as per selected duration.
          </Text>
        </View>

        {/* Static for now: preview only */}
        <TouchableOpacity
          style={styles.payBtn}
          activeOpacity={0.85}
          onPress={() =>
            Toast.show({
              type: 'info',
              text1: 'This is a preview. Booking is disabled.',
              position: 'top',
            })
          }
        >
          <ModeIcon size={wp(18)} color={colors.white} />
          <Text style={styles.payBtnText}>
            {price > 0 ? `Pay ${money(total)} & Book` : 'Book Free Session'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SessionPreview;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: U.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    paddingBottom: hp(12),
    backgroundColor: U.card,
  },
  headerTitle: { fontSize: fp(17), fontWeight: '700', color: U.text },
  scroll: { padding: wp(16), paddingBottom: hp(40), gap: hp(12) },

  banner: {
    height: hp(150),
    borderRadius: wp(16),
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerImg: { borderRadius: wp(16) },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: wp(16),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bannerTitle: {
    fontSize: fp(24),
    fontWeight: '800',
    color: colors.white,
    lineHeight: fp(28),
  },
  bannerSub: {
    fontSize: fp(11),
    color: 'rgba(255,255,255,0.85)',
    marginTop: hp(6),
  },

  card: {
    backgroundColor: U.card,
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: U.border,
    padding: wp(14),
  },
  expertTop: { flexDirection: 'row', gap: wp(12) },
  avatar: { width: wp(60), height: wp(60), borderRadius: wp(30) },
  avatarFallback: {
    backgroundColor: U.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertName: { fontSize: fp(15), fontWeight: '800', color: U.text },
  expertBio: {
    fontSize: fp(12),
    color: U.subHeading,
    marginTop: hp(3),
    lineHeight: fp(17),
  },
  expertMeta: {
    flexDirection: 'row',
    marginTop: hp(14),
    paddingTop: hp(12),
    borderTopWidth: 1,
    borderTopColor: U.border,
  },
  metaCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  metaDivider: {
    width: 1,
    backgroundColor: U.border,
    marginHorizontal: wp(10),
  },
  metaLabel: { fontSize: fp(10), color: U.subHeading },
  metaValue: {
    fontSize: fp(13),
    fontWeight: '700',
    color: U.text,
    marginTop: hp(1),
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginBottom: hp(10),
  },
  sectionTitle: { fontSize: fp(14), fontWeight: '800', color: U.text },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(10) },
  detailLabel: { fontSize: fp(13), color: U.subHeading },
  detailValue: { fontSize: fp(13), fontWeight: '600', color: U.text },

  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(6),
  },
  payLabel: { fontSize: fp(13), color: U.subHeading },
  payValue: { fontSize: fp(13), fontWeight: '700', color: U.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: U.accentSoft,
    borderRadius: wp(10),
    paddingHorizontal: wp(12),
    paddingVertical: hp(12),
    marginTop: hp(8),
  },
  totalLabel: { fontSize: fp(14), fontWeight: '800', color: colors.creatorGreenDark },
  totalValue: { fontSize: fp(18), fontWeight: '800', color: colors.creatorGreenDark },

  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: U.accentSoft,
    borderRadius: wp(10),
    padding: wp(12),
  },
  secureText: { flex: 1, fontSize: fp(11), color: colors.creatorGreenDark },

  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(8),
    backgroundColor: U.accent,
    borderRadius: wp(14),
    paddingVertical: hp(15),
    marginTop: hp(4),
  },
  payBtnText: { fontSize: fp(15), fontWeight: '800', color: colors.white },
  cancelBtn: { alignItems: 'center', paddingVertical: hp(8) },
  cancelText: { fontSize: fp(14), fontWeight: '600', color: U.subHeading },
});