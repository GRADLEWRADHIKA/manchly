import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';
import {
  Video,
  GraduationCap,
  UserCircle,
  Bell,
  ArrowRight,
  ChevronRight,
  Target,
  Mic,
  BadgeDollarSign,
  CalendarDays,
  Share2,
  RefreshCcw,
  BarChart3,
  Handshake,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const CARD_GAP = wp(12);
const HORIZONTAL_PAD = wp(16);
const CARD_WIDTH = (width - HORIZONTAL_PAD * 2 - CARD_GAP) / 2;

const CREATOR_TIPS = [
  {
    icon: <Target size={wp(22)} color={colors.error} />,
    iconBg: colors.lightGrey,
    title: 'Keep it focused',
    description:
      'Short, specific courses on Manchly sell better than broad ones. Pick one skill and go deep.',
  },
  {
    icon: <Mic size={wp(22)} color={colors.textMuted} />,
    iconBg: colors.surface,
    title: 'Audio matters most',
    description:
      'Clear sound boosts course completion. Use a quiet room — your phone mic works fine to start.',
  },
  {
    icon: <BadgeDollarSign size={wp(22)} color={colors.golden} />,
    iconBg: colors.lightGrey,
    title: 'Price with confidence',
    description:
      "Don't underprice your expertise. Manchly creators who charge fairly earn more and attract serious learners.",
  },
  {
    icon: <CalendarDays size={wp(22)} color={colors.secondary} />,
    iconBg: colors.lightGrey,
    title: 'Host a workshop first',
    description:
      'Not ready for a full course? Start with a live workshop on Manchly — faster to launch and builds trust.',
  },
  {
    icon: <Share2 size={wp(22)} color={colors.success} />,
    iconBg: colors.surface,
    title: 'Share your Manchly link',
    description:
      'Paste your creator profile link in your Instagram bio, WhatsApp status, and Reels. Your audience is already there.',
  },
  {
    icon: <RefreshCcw size={wp(22)} color={colors.info} />,
    iconBg: colors.surface,
    title: 'Repurpose your content',
    description:
      'Turn one course module into 3 short reels. More content, same effort — and it drives traffic back to Manchly.',
  },
  {
    icon: <BarChart3 size={wp(22)} color={colors.secPrimary} />,
    iconBg: colors.surface,
    title: 'Watch your dashboard',
    description:
      'Check your Manchly dashboard weekly. See where students drop off and improve just that one section.',
  },
  {
    icon: <Handshake size={wp(22)} color={colors.golden} />,
    iconBg: colors.lightGrey,
    title: 'Payments are seamless',
    description:
      'Manchly handles all payments for you. No third-party gateways needed — money hits your account directly.',
  },
];

const CreateProducts = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <UserCircle size={wp(28)} color={colors.white} />
              </View>
            )}
            <View>
              <Text style={styles.headerSub}>Hello, {displayName}</Text>
              <Text style={styles.headerTitle}>Create Product</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('CreatorNotification')}
          >
            <Bell size={wp(20)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Title */}
        <Text style={styles.sectionTitle}>What would you like to create?</Text>

        {/* Cards Row */}
        <View style={styles.cardsRow}>
          {/* Webinar Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => {
              if (user?.kyc_verified) {
                navigation.navigate('CreateWebinar');
              } else {
                navigation.navigate('KYCVerificationScreen');
              }
            }}
          >
            <View
              style={[styles.cardInner, { backgroundColor: colors.lightGrey }]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.placeholder },
                ]}
              >
                <Video size={wp(24)} color={colors.secondary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.secondary }]}>
                Webinar
              </Text>
              <Text style={styles.cardDesc}>
                Host live sessions & workshops
              </Text>
              <View
                style={[
                  styles.cardButton,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Text style={styles.cardButtonText}>Create</Text>
                <ArrowRight size={wp(14)} color={colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Course Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => {
              if (user?.kyc_verified) {
                navigation.navigate('CreateCourse');
              } else {
                navigation.navigate('KYCVerificationScreen');
              }
            }}
          >
            <View
              style={[styles.cardInner, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.borderLight },
                ]}
              >
                <GraduationCap size={wp(24)} color={colors.accent} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.accent }]}>
                Course
              </Text>
              <Text style={styles.cardDesc}>Build video courses & modules</Text>
              <View
                style={[styles.cardButton, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.cardButtonText}>Create</Text>
                <ArrowRight size={wp(14)} color={colors.white} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Creator Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsSectionHeader}>
            <Text style={styles.tipsSectionTitle}>Creator Tips</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View all</Text>
              <ArrowRight size={wp(14)} color={colors.info} />
            </TouchableOpacity>
          </View>

          {CREATOR_TIPS.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <View
                style={[styles.tipIconWrap, { backgroundColor: tip.iconBg }]}
              >
                {tip.icon}
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.description}</Text>
              </View>
              <ChevronRight
                size={wp(18)}
                color={colors.muted}
                style={styles.tipChevron}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateProducts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerWrapper: {
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(46),
    height: wp(46),
    borderRadius: wp(23),
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  headerSub: {
    fontSize: fp(12),
    color: colors.textMuted,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: hp(16),
    paddingBottom: hp(32),
  },

  // Section
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.heading,
    marginBottom: hp(14),
  },

  // Cards Row
  cardsRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: wp(20),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardInner: {
    borderRadius: wp(20),
    paddingHorizontal: wp(14),
    paddingTop: wp(18),
    paddingBottom: wp(14),
    alignItems: 'center',
  },
  iconCircle: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  cardTitle: {
    fontSize: fp(16),
    fontWeight: '800',
    marginBottom: hp(4),
  },
  cardDesc: {
    fontSize: fp(11.5),
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: fp(16),
    marginBottom: hp(12),
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(6),
    paddingHorizontal: wp(18),
    paddingVertical: hp(9),
    borderRadius: wp(22),
  },
  cardButtonText: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.white,
  },

  // Creator Tips
  tipsSection: {
    marginTop: hp(28),
  },
  tipsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(14),
  },
  tipsSectionTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.heading,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  viewAllText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.info,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: wp(16),
    padding: wp(14),
    marginBottom: hp(10),
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tipIconWrap: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    color: colors.heading,
    marginBottom: hp(4),
  },
  tipDesc: {
    fontSize: fp(12),
    color: colors.textSecondary,
    lineHeight: fp(17),
  },
  tipChevron: {
    marginLeft: wp(8),
  },
});
