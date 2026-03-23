import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
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
  UserCircle,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
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

const CreatorSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.greetingWrap}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <UserCircle size={wp(32)} color={colors.primary} />
              </View>
            )}
            <View>
              <Text style={styles.greetingLabel}>Hello,</Text>
              <Text style={styles.greetingText}>{displayName}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topCardWrapper}>
          <TouchableOpacity
            style={styles.topCard}
            activeOpacity={0.9}
            onPress={() => openWhatsApp('Hello, I am a Creator, I need help.')}
          >
            <Headset size={wp(20)} color={colors.primary} />
            <Text style={styles.topCardText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topCard}
            activeOpacity={0.9}
            onPress={() =>
              openWhatsApp('Hello, I am a Creator, I need help for marketing.')
            }
          >
            <Megaphone size={wp(20)} color={colors.primary} />
            <Text style={styles.topCardText}>Marketing Contact</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.withdrawCard}>
          <View style={styles.withdrawLeft}>
            <WalletMinimal size={wp(22)} color={colors.primary} />
            <View style={{ marginLeft: wp(12) }}>
              <Text style={styles.withdrawLabel}>Withdrawable Balance</Text>
              <Text style={styles.withdrawAmount}>₹ *****</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8}>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => Nav.navigate('CreatorProfile')}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <User2 size={wp(20)} color={colors.text} />
              </View>
              <Text style={styles.rowText}>My Profile</Text>
            </View>
            <ChevronRight size={wp(18)} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => Nav.navigate('WalletCreator')}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <WalletMinimal size={wp(20)} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Wallet</Text>
            </View>
            <ChevronRight size={wp(18)} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            activeOpacity={0.7}
            onPress={() => setLogoutVisible(true)}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <LogOut size={wp(20)} color={colors.error} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </View>
            <ChevronRight size={wp(18)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: colors.surface,
  },
  headerWrapper: {
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: wp(20),
    paddingVertical: hp(16),
  },
  greetingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(27),
    backgroundColor: colors.lightGrey,
    marginRight: wp(14),
  },
  avatarFallback: {
    width: wp(54),
    height: wp(54),
    borderRadius: wp(27),
    backgroundColor: colors.lightGrey,
    marginRight: wp(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingLabel: {
    color: colors.textSecondary,
    fontSize: fp(14),
    fontWeight: '500',
  },
  greetingText: {
    color: colors.primary,
    fontSize: fp(18),
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(24),
  },
  topCardWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    marginTop: hp(20),
    marginBottom: hp(10),
  },
  topCard: {
    width: '48%',
    paddingVertical: hp(15),
    paddingHorizontal: wp(10),
    borderRadius: wp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: colors.white,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    justifyContent: 'center',
  },
  topCardText: {
    color: colors.text,
    fontSize: fp(13),
    fontWeight: '600',
  },
  withdrawCard: {
    marginTop: hp(8),
    backgroundColor: colors.white,
    borderRadius: wp(14),
    padding: wp(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: wp(16),
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: hp(20),
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  withdrawLabel: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fp(13),
  },
  withdrawAmount: {
    color: colors.primary,
    marginTop: hp(2),
    fontSize: fp(18),
    fontWeight: '900',
  },
  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingVertical: hp(8),
    paddingHorizontal: wp(16),
    borderRadius: wp(10),
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.white,
    fontSize: fp(13),
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: wp(16),
    borderRadius: wp(14),
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: wp(28),
    alignItems: 'center',
    marginRight: wp(12),
  },
  rowText: {
    fontSize: fp(15),
    color: colors.text,
    fontWeight: '500',
  },
  logoutText: {
    fontSize: fp(15),
    color: colors.error,
    fontWeight: '500',
  },
});
