import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  User2,
  ChevronRight,
  LogOut,
  Headset,
  Notebook,
  ArrowLeft,
  Wallet,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import TermsModal from '../../../../components/TermsModal';
import { getEnrolledCourses } from '../../../../store/CourseSlice';
import { getEnrolledWebinar } from '../../../../store/WebinarSlice';
import { getMySessions } from '../../../../store/SessionSlice';
import PrivacyModal from '../../../../components/PrivacyModal';
import RefundPolicyModal from '../../../../components/RefundPolicyModal';
import ContactUsModal from '../../../../components/ContactUsModal';
import { version as appVersion } from '../../../../../package.json';

const SUPPORT_PHONE = '6363790659';

const openWhatsApp = (message: string) => {
  const url = `whatsapp://send?phone=91${SUPPORT_PHONE}&text=${encodeURIComponent(
    message,
  )}`;
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        Toast.show({
          type: 'error',
          text1: 'WhatsApp not installed',
          text2: 'Please install WhatsApp to contact support',
          position: 'top',
        });
      } else {
        return Linking.openURL(url);
      }
    })
    .catch(err => {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: err?.message || 'Unable to open WhatsApp',
        position: 'top',
      });
    });
};

/* ──────── Reusable Menu Row ──────── */
const MenuRow = ({
  icon: Icon,
  iconColor = colors.greenButtonDark,
  iconBg = colors.user.accentSoft,
  label,
  labelColor = colors.user.text,
  subtitle,
  onPress,
  isLast = false,
}: any) => (
  <Pressable
    style={({ pressed }) => [
      styles.row,
      !isLast && styles.rowBorder,
      pressed && styles.rowPressed,
    ]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <View style={styles.rowLeft}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon size={wp(19)} color={iconColor} strokeWidth={2.2} />
      </View>
      <View>
        <Text style={[styles.rowText, { color: labelColor }]}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtext}>{subtitle}</Text>}
      </View>
    </View>
    <ChevronRight size={wp(18)} color={colors.user.subHeading} />
  </Pressable>
);

/* ──────── Quick Action Card (kept for potential future use, unused in current layout) ──────── */
const QuickAction = ({ icon: Icon, label, subtitle, color, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.topCard, pressed && styles.topCardPressed]}
    onPress={onPress}
  >
    <View style={[styles.topCardIcon, { backgroundColor: color + '12' }]}>
      <Icon size={wp(20)} color={color} strokeWidth={1.8} />
    </View>
    <Text style={styles.topCardText}>{label}</Text>
    {subtitle && <Text style={styles.topCardSubtext}>{subtitle}</Text>}
  </Pressable>
);

const UserSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const Nav = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState({ courses: 0, webinars: 0, sessions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadStats = async () => {
        setStatsLoading(true);
        try {
          const [coursesRes, webinarsRes, sessionsRes] =
            await Promise.allSettled([
              dispatch(getEnrolledCourses({ limit: 1 })).unwrap(),
              dispatch(
                getEnrolledWebinar({ page: 1, limit: 1, upcoming: false }),
              ).unwrap(),
              dispatch(getMySessions({ role: 'caller', limit: 1 })).unwrap(),
            ]);

          if (!isActive) return;

          setStats({
            courses:
              coursesRes.status === 'fulfilled'
                ? coursesRes.value?.pagination?.total ?? 0
                : 0,
            webinars:
              webinarsRes.status === 'fulfilled'
                ? webinarsRes.value?.data?.data?.pagination?.total ?? 0
                : 0,
            sessions:
              sessionsRes.status === 'fulfilled'
                ? sessionsRes.value?.data?.total ?? 0
                : 0,
          });
        } finally {
          if (isActive) setStatsLoading(false);
        }
      };

      loadStats();
      return () => {
        isActive = false;
      };
    }, [dispatch]),
  );

  return (
    <View style={styles.container}>
      {/* ──────── Header ──────── */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => Nav.goBack()} hitSlop={10}>
            <ArrowLeft size={wp(22)} color={colors.user.icon} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: wp(22) }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Manage your account and settings
        </Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ──────── Profile Card ──────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <User2 size={wp(24)} color={colors.greenButtonDark} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name || 'Your Name'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email || ''}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {statsLoading ? (
              <ActivityIndicator size="small" color={colors.greenButtonDark} />
            ) : (
              <>
                <Text style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.courses}</Text> Courses
                </Text>
                <Text style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.webinars}</Text>{' '}
                  Webinars
                </Text>
                <Text style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.sessions}</Text> 1:1
                  Sessions
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ──────── Account Section ──────── */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <MenuRow
            icon={User2}
            label="My Profile"
            subtitle="Manage your profile"
            onPress={() => Nav.navigate('UserProfile')}
          />
          <MenuRow
            icon={Wallet}
            label="Payment & Billing"
            subtitle="View your payments, invoices & purchase history"
            onPress={() => Nav.navigate('PaymentBilling')}
          />
          <MenuRow
            icon={Headset}
            label="Help & Support"
            subtitle="Get help or contact us"
            onPress={() => openWhatsApp('Hello, I am a User, I need help.')}
          />
          <MenuRow
            icon={Notebook}
            label="About"
            subtitle="Terms, privacy & policies"
            onPress={() => setShowTerms(true)}
          />
          <MenuRow
            icon={LogOut}
            iconBg="#FEE2E2"
            iconColor={colors.error}
            label="Logout"
            labelColor={colors.error}
            onPress={() => setLogoutVisible(true)}
            isLast
          />
        </View>

        <Text style={styles.versionText}>Version {appVersion}</Text>
      </ScrollView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
      <RefundPolicyModal
        visible={showRefund}
        onClose={() => setShowRefund(false)}
      />
      <ContactUsModal
        visible={showContact}
        onClose={() => setShowContact(false)}
      />

      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          dispatch(logout());
        }}
      />
    </View>
  );
};

export default UserSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.user.bg,
  },

  headerWrapper: {
    zIndex: 10,
  },
 header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: wp(16),
  paddingTop: hp(14),
  paddingBottom: hp(6),
},
headerSubtitle: {
  fontSize: fp(13),
  color: colors.user.subHeading,
  textAlign: 'center',
  paddingHorizontal: wp(16),
  marginBottom: hp(8),
},
  headerTitle: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.user.text,
  },

  /* ──── Body ──── */
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  /* ──── Quick Actions (unused in current layout, kept for future use) ──── */
  topCardWrapper: {
    flexDirection: 'row',
    paddingHorizontal: wp(16),
    marginTop: hp(18),
    marginBottom: hp(14),
    gap: wp(12),
  },
  topCard: {
    flex: 1,
    paddingVertical: hp(16),
    paddingHorizontal: wp(14),
    borderRadius: wp(14),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(8),
    backgroundColor: colors.user.card,
  },
  topCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  topCardIcon: {
    width: wp(42),
    height: wp(42),
    borderRadius: wp(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardText: {
    color: colors.user.text,
    fontSize: fp(13),
    fontWeight: '600',
  },
  topCardSubtext: {
    color: colors.user.subHeading,
    fontSize: fp(11),
    textAlign: 'center',
    lineHeight: fp(15),
  },

  /* ──── Sections ──── */
  sectionTitle: {
    fontSize: fp(12),
    fontWeight: '700',
    color: colors.user.subHeading,
    letterSpacing: 0.8,
    marginHorizontal: wp(20),
    marginTop: hp(16),
    marginBottom: hp(12),
  },
  section: {
    backgroundColor: colors.user.card,
    borderWidth: 1,
    borderColor: colors.user.border,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    overflow: 'hidden',
  },

  /* ──── Rows ──── */
  row: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.user.border,
  },
  rowPressed: {
    backgroundColor: colors.user.cardSoft,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp(12),
  },
  rowIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: fp(15),
    fontWeight: '500',
  },
  rowSubtext: {
    fontSize: fp(12),
    color: colors.user.subHeading,
    marginTop: hp(1),
  },

  versionText: {
    textAlign: 'center',
    fontSize: fp(12),
    color: colors.user.subHeading,
    marginTop: hp(24),
    fontWeight: '500',
  },
  profileCard: {
    backgroundColor: colors.user.card,
    borderWidth: 1,
    borderColor: colors.user.border,
    marginHorizontal: wp(16),
    marginTop: hp(8),
    borderRadius: wp(16),
    padding: wp(16),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(26),
  },
  avatarFallback: {
    backgroundColor: colors.user.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fp(16),
    fontWeight: '700',
    color: colors.user.text,
  },
  profileEmail: {
    fontSize: fp(12),
    color: colors.user.subHeading,
    marginTop: hp(2),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(14),
    paddingTop: hp(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.user.border,
  },
  statItem: {
    fontSize: fp(12),
    color: colors.user.subHeading,
  },
  statNumber: {
    fontSize: fp(13),
    fontWeight: '700',
    color: colors.user.text,
  },
});
