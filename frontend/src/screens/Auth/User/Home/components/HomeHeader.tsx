import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../../utils/colors';
import { Search, Bell } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';

const HomeHeader = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'User';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <View style={[styles.mainHeader, { paddingTop: insets.top + hp(4) }]}>
        <Pressable
          style={styles.headerLeft}
          onPress={() => navigation.navigate('UserSetting')}>
          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          {/* <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            onPress={() => navigation.navigate('UserNotification')}
            accessibilityLabel="Notifications">
            <Bell size={wp(18)} color={colors.white} strokeWidth={2} />
          </Pressable> */}
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
            onPress={() => navigation.navigate('ProductsScreen')}
            accessibilityLabel="Search courses">
            <Search size={wp(18)} color={colors.white} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
      <View style={styles.headerCurve} />
    </>
  );
};

export default memo(HomeHeader);

const styles = StyleSheet.create({
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    paddingBottom: hp(14),
    backgroundColor: colors.secPrimary,
    zIndex: 10,
  },
  headerCurve: {
    backgroundColor: colors.secPrimary,
    height: hp(16),
    borderBottomLeftRadius: wp(28),
    borderBottomRightRadius: wp(28),
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
    flex: 1,
  },
  avatar: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: fp(18),
    fontWeight: '700',
  },
  greetingLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  greetingName: {
    fontSize: fp(17),
    fontWeight: '600',
    color: colors.white,
    lineHeight: fp(22),
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp(10),
  },
  iconBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ scale: 0.93 }],
  },
});
