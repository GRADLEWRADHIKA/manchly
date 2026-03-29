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
  Bell,
  UserCircle,
  Notebook,
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
  const Nav = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

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
              <Text style={styles.headerTitle}>
                {user?.name
                  ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                  : 'User'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
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
            onPress={() => openWhatsApp('Hello, I am a User, I need help.')}
          />
          <QuickAction
            icon={Notebook}
            label="About"
            subtitle="Learn more about our app, features, and community."
            color="#10B981"
            onPress={() => {}}
          />
        </View>

        {/* ──────── Account Section ──────── */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <MenuRow
            icon={User2}
            iconBg="#f0f4ff"
            iconColor="#3B82F6"
            label="My Profile"
            subtitle="Manage your profile"
            onPress={() => Nav.navigate('UserProfile')}
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

export default UserSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },

  headerWrapper: {
    backgroundColor: colors.secPrimary,
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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarFallback: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(16),
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(32),
    height: wp(32),
    borderRadius: wp(10),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
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
  topCardSubtext: {
    color: colors.textSecondary,
    fontSize: fp(11),
    textAlign: 'center',
    lineHeight: fp(15),
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
});
