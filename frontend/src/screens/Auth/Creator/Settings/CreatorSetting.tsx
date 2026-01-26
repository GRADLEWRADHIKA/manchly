import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
  Linking,
} from 'react-native';
import colors from '../../../../utils/colors';
import {
  User2,
  ChevronRight,
  LogOut,
  Headset,
  Megaphone,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const CreatorSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const RightChevron = (
    <ChevronRight size={18} color={colors.textSecondary} />
  );

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.mainHeader, { paddingTop: insets.top + 10 }]} />

      <View style={styles.header}>
        <View style={styles.greetingWrap}>
          <Image source={{ uri: user?.profile_image }} style={styles.avatar} />
          <Text style={styles.greetingText}>
            Hello,{' '}
            {user?.name
              ? user?.name.charAt(0).toUpperCase() + user?.name.slice(1)
              : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topCardWrapper}>
          <TouchableOpacity style={styles.topCard} activeOpacity={0.9}
            onPress={() => {
              const phoneNumber = '6363790659';
              const message = 'Hello, I am Crator,I need help.';
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
            }}
          >
            <Headset size={20} />
            <Text style={styles.topCardText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topCard} activeOpacity={0.9}
            onPress={() => {
              const phoneNumber = '6363790659';
              const message = 'Hello, I am Crator,I need help for marketing';
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
            }}
          >
            <Megaphone size={20} />
            <Text style={styles.topCardText}>Contact for Marketing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.withdrawCard}>
          <View style={styles.withdrawLeft}>
            <View style={{ marginLeft: 12 }}>
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
            onPress={() => Nav.navigate('UserProfile')}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <User2 size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>My Profile</Text>
            </View>
            {RightChevron}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setLogoutVisible(true)}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <LogOut size={20} color={colors.error} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </View>
            {RightChevron}
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
    backgroundColor: colors.white,
  },

  mainHeader: {
    backgroundColor: colors.primary,
  },

  header: {
    backgroundColor: colors.primary,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },

  greetingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff33',
    marginRight: 12,
  },

  greetingText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },

  body: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  topCardWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  topCard: {
    width: '48%',
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    elevation: 5,
    justifyContent: 'center'
  },

  topCardText: {
    color: colors.text,
    fontSize: 14,
  },

  section: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },

  rowText: {
    fontSize: 16,
    color: colors.text,
  },

  logoutText: {
    fontSize: 16,
    color: colors.error,
  },

  withdrawCard: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    elevation: 5,
    marginBottom: 20,
  },
  withdrawLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  withdrawLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  withdrawAmount: {
    color: colors.primary,
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
  },
  withdrawBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  withdrawBtnText: {
    fontWeight: '800',
    color: colors.white,
  },
});
