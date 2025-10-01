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
import colors from '../../../theme/colors';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearStoredAuth } from '../../../store/authSlice';
import {
  User2,
  LayoutDashboard,
  Gift,
  Settings as SettingsIcon,
  List as ListIcon,
  Landmark,
  Wallet as WalletIcon,
  ChevronRight,
} from 'lucide-react-native';
import LogoutModal from './Components/LogoutModal';
import AppHeader from '../../../components/AppHeader';
import { useNavigation } from '@react-navigation/native';

const APP_VERSION = '10.2.7';

const NewBadge = () => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>NEW</Text>
  </View>
);

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const Nav = useNavigation();
  const userType = useAppSelector(state => state.auth.userType);

  const handleLogout = async () => {
    setLogoutVisible(false);
    await dispatch(clearStoredAuth());
  };
  const RightChevron = <ChevronRight size={18} color={colors.textSecondary} />;

  return (
    <View style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <AppHeader title="Profile" />

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              userType === 'User' ? colors.secPrimary : colors.primary,
          },
        ]}
      >
        <View style={styles.greetingWrap}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/200?img=12' }}
            style={styles.avatar}
          />
          <Text style={styles.greetingText}>Hello, Sumit</Text>
        </View>
      </View>

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
              Nav.navigate('Dashboard');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <LayoutDashboard size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Dashboard</Text>
            </View>
            {RightChevron}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('SuperThank');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Gift size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Super Thanks</Text>
            </View>
            <NewBadge />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('Settings');
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

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              Nav.navigate('Lists');
            }}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <ListIcon size={20} color={colors.text} />
              </View>
              <Text style={styles.rowText}>Lists</Text>
            </View>
            {RightChevron}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.section}>
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
            onPress={() => setLogoutVisible(true)}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <SettingsIcon size={20} color={colors.error} />
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
        onConfirm={handleLogout}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  body: { flex: 1, backgroundColor: colors.background },

  sectionHeader: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  section: {
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
});
