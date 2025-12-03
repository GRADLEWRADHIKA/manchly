import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar as RNStatusBar,
  ImageBackground,
} from 'react-native';
import colors from '../../../../utils/colors';
import {
  User2,
  LayoutDashboard,
  Gift,
  Settings as SettingsIcon,
  List as ListIcon,
  Landmark,
  Wallet as WalletIcon,
  ChevronRight,
  BellDot,
  LogOut,
} from 'lucide-react-native';
import LogoutModal from '../../Profile/Components/LogoutModal';
import AppHeader from '../../../../components/AppHeader';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { logout } from '../../../../store/UserSlice';
import UserIcon from '../Home/component/UserIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APP_VERSION = '0.0.1';

const CreatorSetting: React.FC = () => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation();
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const insets = useSafeAreaInsets();

  const RightChevron = <ChevronRight size={18} color={colors.textSecondary} />;

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.primary} />
      {/* <AppHeader title="Profile" /> */}
      <View
        style={[
          styles.mainHeader,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <ImageBackground
          source={require('../../../../image/background.png')}
          resizeMode="cover"
          style={styles.headerBg}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>Profile</Text>
          </View>
        </ImageBackground>
      </View>
      {/* <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
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
      </View> */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={styles.section}>
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

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('Earnings');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Landmark size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Earnings</Text>
            </View>
            {RightChevron}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('Wallet');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <WalletIcon size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Wallet</Text>
            </View>
            {RightChevron}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('CreatorSettingsDetails');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <SettingsIcon size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Settings</Text>
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

        <Text style={styles.version}>{APP_VERSION}</Text>
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
  container: { flex: 1, backgroundColor: colors.white },

  header: {
    // backgroundColor: colors.primary,
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
    color: colors.primary,
    fontSize: 22,
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
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 16,
    // paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  headerBg: {
    width: '100%',
    // paddingTop: 10,
    // paddingBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 17,
  },
  mainHead: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  firstPara: { color: colors.primary, fontSize: 14, fontWeight: '400' },
  secPara: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
