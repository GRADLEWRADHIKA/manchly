import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
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

const UserSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation();
  const { user, } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const RightChevron = <ChevronRight size={18} color={colors.textSecondary} />;

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={[styles.mainHeader, { paddingTop: insets.top + 10 }]} />

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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.section}>

          <View style={styles.topCardWrapper}>
            <View style={{ width: '48%' }}>
              <TouchableOpacity style={styles.topCard} activeOpacity={0.9}>
                <Headset size={20} />
                <Text style={styles.topCardText}>Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topCard, { marginTop: 10 }]} activeOpacity={0.9}>
                <GraduationCap size={25} strokeWidth={1.5} />
                <Text style={styles.topCardText}>My Learning</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mainHeaderCard}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Notebook size={20} />
                <Text>About</Text>
              </View>
              <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: colors.textSecondary }}>
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
                <User2 size={20} color={colors.text} />
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
                <LogOut size={20} color={colors.error} />
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
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  headerTitle: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  body: { flex: 1, backgroundColor: colors.white },

  sectionHeader: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
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
  rowTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kycStatusText: {
    fontSize: 12,
    color: 'green',
    fontWeight: '600',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ff2d55',
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  version: {
    paddingHorizontal: 16,
    paddingTop: 18,
    fontSize: 13,
    color: colors.textSecondary,
  },
  topCardWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
  },

  topCard: {
    borderColor: colors.border,
    paddingVertical: 20,
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
    fontSize: 16,
  },

  mainHeader: {
    backgroundColor: colors.secPrimary,
  },
  mainHeaderCard: {
    width: '48%',
    borderColor: colors.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    elevation: 5,
    backgroundColor: colors.white,
  }
});
