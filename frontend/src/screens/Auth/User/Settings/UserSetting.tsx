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
import {
  User2,
  Settings as SettingsIcon,
  List as ListIcon,
  Wallet as WalletIcon,
  ChevronRight,
  LogOut,
  Headset,
  Megaphone,
  GraduationCap,
  Notebook,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { wp, hp, fp } from '../../../../utils/responsive';

const UserSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation();
  const { user, } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const RightChevron = <ChevronRight size={wp(18)} color={colors.textSecondary} />;

  return (
    <View style={styles.container}>
      <View style={[styles.mainHeader, { paddingTop: insets.top + hp(10) }]} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.secPrimary,
          },
        ]}
      >
        <View style={styles.greetingWrap}>
          <Image source={{ uri: user?.profile_image }} style={styles.avatar} />
          <Text style={styles.greetingText}>
            Hello,{' '}
            {user?.name
              ? user?.name?.charAt(0).toUpperCase() + user?.name?.slice(1)
              : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: hp(24) }}
      >
        <View style={styles.section}>

          <View style={styles.topCardWrapper}>
            <View style={{ width: '48%' }}>
              <TouchableOpacity style={styles.topCard} activeOpacity={0.9}
                onPress={() => {
                  const phoneNumber = '6363790659';
                  const message = 'Hello, I am user,I need help.';
                  const url = `whatsapp://send?phone=91${phoneNumber}&text=${encodeURIComponent(
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
                }} >
                <Headset size={wp(20)} />
                <Text style={styles.topCardText}>Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topCard, { marginTop: hp(10) }]} activeOpacity={0.9}>
                <GraduationCap size={wp(25)} strokeWidth={1.5} />
                <Text style={styles.topCardText}>My Learning</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mainHeaderCard}>
              <View style={{ alignItems: 'center', gap: wp(8) }}>
                <Notebook size={wp(20)} />
                <Text>About</Text>
              </View>
              <Text style={{ marginTop: hp(10), textAlign: 'center', fontSize: fp(12), color: colors.textSecondary }}>
                Learn more about our app, features, and community.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('UserProfile');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <User2 size={wp(20)} color={colors.text} />
              </View>
              <Text style={styles.rowText}>My Profile</Text>
            </View>
            {RightChevron}
          </TouchableOpacity>

        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setLogoutVisible(true)}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <LogOut size={wp(20)} color={colors.error} />
              </View>
              <Text style={[styles.rowText, { color: colors.error }]}>
                Logout
              </Text>
            </View>
            {RightChevron}
          </TouchableOpacity>
        </View>

        {/* <Text style={styles.version}>{APP_VERSION}</Text> */}
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
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingBottom: hp(18),
    paddingHorizontal: wp(16),
  },
  headerTitle: {
    textAlign: 'center',
    color: colors.white,
    fontSize: fp(22),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: hp(16),
  },
  greetingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: wp(54),
    height: hp(54),
    borderRadius: wp(27),
    backgroundColor: '#ffffff33',
    marginRight: wp(12),
  },
  greetingText: {
    color: colors.white,
    fontSize: fp(18),
    fontWeight: '700',
  },

  body: { flex: 1, backgroundColor: colors.white },

  sectionHeader: {
    fontSize: fp(14),
    color: colors.textSecondary,
    paddingHorizontal: wp(16),
    paddingTop: hp(20),
    paddingBottom: hp(8),
  },

  section: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  row: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
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
    fontSize: fp(16),
    color: colors.text,
  },
  rowTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
  },
  kycStatusText: {
    fontSize: fp(12),
    color: 'green',
    fontWeight: '600',
  },

  badge: {
    paddingHorizontal: wp(10),
    paddingVertical: hp(4),
    backgroundColor: '#ff2d55',
    borderRadius: wp(999),
  },
  badgeText: {
    color: colors.white,
    fontSize: fp(11),
    fontWeight: '700',
  },

  version: {
    paddingHorizontal: wp(16),
    paddingTop: hp(18),
    fontSize: fp(13),
    color: colors.textSecondary,
  },
  topCardWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: wp(16),
    marginTop: hp(20),
    marginBottom: hp(10),
    flexDirection: 'row',
  },

  topCard: {
    borderColor: colors.border,
    paddingVertical: hp(20),
    paddingHorizontal: wp(10),
    borderRadius: wp(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    backgroundColor: colors.white,
    elevation: 5,
    justifyContent: 'center'
  },

  topCardText: {
    color: colors.text,
    fontSize: fp(16),
  },

  mainHeader: {
    backgroundColor: colors.secPrimary,
  },
  mainHeaderCard: {
    width: '48%',
    borderColor: colors.border,
    borderRadius: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(20),
    elevation: 5,
    backgroundColor: colors.white,
  }
});
