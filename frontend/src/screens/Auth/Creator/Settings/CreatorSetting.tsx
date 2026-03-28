import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import {
  User2,
  ChevronRight,
  LogOut,
  Headset,
  Megaphone,
  WalletMinimal,
  Bell,
  Settings,
  UserCircle,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

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
          position: 'bottom',
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
        position: 'bottom',
      });
    });
};

/* ──────── Reusable Menu Row ──────── */
const MenuRow = ({
  icon: Icon,
  iconColor = colors.text,
  iconBg = '#f4f4f5',
  label,
  labelColor = colors.text,
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
        <Icon size={wp(18)} color={iconColor} strokeWidth={1.8} />
      </View>
      <View>
        <Text style={[styles.rowText, { color: labelColor }]}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtext}>{subtitle}</Text>}
      </View>
    </View>
    <ChevronRight size={wp(18)} color="#c8ccd0" />
  </Pressable>
);

/* ──────── Quick Action Card ──────── */
const QuickAction = ({ icon: Icon, label, color, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.topCard, pressed && styles.topCardPressed]}
    onPress={onPress}
  >
    <View style={[styles.topCardIcon, { backgroundColor: color + '12' }]}>
      <Icon size={wp(20)} color={color} strokeWidth={1.8} />
    </View>
    <Text style={styles.topCardText}>{label}</Text>
  </Pressable>
);

const CreatorSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'C';

  return (
    <View style={styles.container}>
      {/* ──────── Header ──────── */}
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
              <Text style={styles.headerSubtitle}>Welcome Back</Text>
              <Text style={styles.headerTitle}>{user.name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Nav.navigate('CreatorNotification')}
          >
            <Bell size={wp(20)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ──────── Quick Actions ──────── */}
        <View style={styles.topCardWrapper}>
          <QuickAction
            icon={Headset}
            label="Help & Support"
            color="#3B82F6"
            onPress={() => openWhatsApp('Hello, I am a Creator, I need help.')}
          />
          <QuickAction
            icon={Megaphone}
            label="Marketing"
            color="#8B5CF6"
            onPress={() =>
              openWhatsApp('Hello, I am a Creator, I need help for marketing.')
            }
          />
        </View>

        {/* ──────── Wallet Card ──────── */}
        <View style={styles.withdrawCard}>
          <View style={styles.withdrawLeft}>
            <View style={styles.walletIconWrap}>
              <WalletMinimal
                size={wp(20)}
                color={colors.white}
                strokeWidth={2}
              />
            </View>
            <View style={styles.withdrawInfo}>
              <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
              <Text style={styles.withdrawAmount}>₹ *****</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.withdrawBtn,
              pressed && styles.withdrawBtnPressed,
            ]}
          >
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </Pressable>
        </View>

        {/* ──────── Account Section ──────── */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <MenuRow
            icon={User2}
            iconBg="#f0f4ff"
            iconColor="#3B82F6"
            label="My Profile"
            subtitle="Manage your public profile"
            onPress={() => Nav.navigate('CreatorProfile')}
          />
          <MenuRow
            icon={WalletMinimal}
            iconBg="#f0fdf4"
            iconColor={colors.success}
            label="Wallet"
            subtitle="Earnings & transactions"
            onPress={() => Nav.navigate('WalletCreator')}
          />
          <MenuRow
            icon={Settings}
            iconBg="#f4f4f5"
            iconColor={colors.textSecondary}
            label="Settings"
            subtitle="App preferences"
            onPress={() => Nav.navigate('CreatorSettingDetails')}
            isLast
          />
        </View>

        {/* ──────── Logout Section ──────── */}
        <View style={styles.logoutSection}>
          <MenuRow
            icon={LogOut}
            iconBg="#fef2f2"
            iconColor={colors.error}
            label="Logout"
            labelColor={colors.error}
            onPress={() => setLogoutVisible(true)}
            isLast
          />
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

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

export default CreatorSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },

  headerWrapper: {
    backgroundColor: '#111111',
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerCurve: {
    backgroundColor: '#111111',
    height: hp(6),
    borderBottomLeftRadius: wp(20),
    borderBottomRightRadius: wp(20),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    flex: 1,
  },
  avatar: {
    width: wp(34),
    height: wp(34),
    borderRadius: wp(11),
    borderWidth: 1.5,
    borderColor: '#2a2a2e',
  },
  avatarFallback: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(16),
    backgroundColor: '#2a2a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: fp(17),
    fontWeight: '700',
  },
  greetingWrap: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: fp(11),
    color: '#808088',
    fontWeight: '500',
  },
  greetingText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: colors.white,
    marginTop: 0,
  },
  bellBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(10),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ scale: 0.93 }],
  },

  /* ──── Body ──── */
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(40),
  },

  /* ──── Quick Actions ──── */
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
    gap: hp(8),
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
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
    color: colors.text,
    fontSize: fp(13),
    fontWeight: '600',
  },

  /* ──── Wallet Card ──── */
  withdrawCard: {
    marginHorizontal: wp(16),
    backgroundColor: '#111111',
    borderRadius: wp(16),
    padding: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(22),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIconWrap: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawInfo: {
    marginLeft: wp(12),
    flex: 1,
  },
  withdrawLabel: {
    color: '#808088',
    fontWeight: '500',
    fontSize: fp(12),
  },
  withdrawAmount: {
    color: colors.white,
    marginTop: hp(2),
    fontSize: fp(20),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  withdrawBtn: {
    backgroundColor: colors.white,
    paddingVertical: hp(9),
    paddingHorizontal: wp(18),
    borderRadius: wp(10),
  },
  withdrawBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  withdrawBtnText: {
    fontWeight: '700',
    color: '#111111',
    fontSize: fp(13),
  },

  /* ──── Sections ──── */
  sectionTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: wp(20),
    marginBottom: hp(8),
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    borderRadius: wp(16),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
    overflow: 'hidden',
  },
  logoutSection: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    marginTop: hp(16),
    borderRadius: wp(16),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eaecef',
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
    borderBottomColor: '#f0f2f5',
  },
  rowPressed: {
    backgroundColor: '#f8f9fa',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    width: wp(36),
    height: wp(36),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  rowText: {
    fontSize: fp(15),
    color: colors.text,
    fontWeight: '500',
  },
  rowSubtext: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(1),
  },

  versionText: {
    textAlign: 'center',
    fontSize: fp(12),
    color: colors.muted,
    marginTop: hp(24),
    fontWeight: '500',
  },
  headerSubtitle: {
     fontSize: fp(12),
    color: '#999999',
    fontWeight: '500',
  },
  headerTitle: {
     fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
});
