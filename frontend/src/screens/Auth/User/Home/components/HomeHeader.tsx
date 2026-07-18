import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../../utils/colors';
import { Search, Bell, Instagram } from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../../utils/responsive';
import { getUnreadCount } from '../../../../../store/NotificationSlice';

const HomeHeader = () => {
  const { user } = useSelector((state: any) => state.userReducer);
  const { unreadCount } = useSelector((state: any) => state.notificationReducer);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  React.useEffect(() => {
    dispatch(getUnreadCount());
  }, [dispatch]);

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
          <Text style={styles.greetingName} numberOfLines={1}>
            Hello {displayName?.split(' ')[0]},
          </Text>
          <Text style={styles.greetingLabel}>{getGreeting()}</Text>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable
          style={styles.hiddenIconBtn}
          onPress={() => Linking.openURL('https://www.instagram.com/manchly_app')}
          accessibilityLabel="Instagram">
          <Instagram size={wp(18)} color={colors.white} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.hiddenIconBtn}
          onPress={() => navigation.navigate('ProductsScreen')}
          accessibilityLabel="Search courses">
          <Search size={wp(18)} color={colors.white} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
          onPress={() => navigation.navigate('UserNotification')}
          accessibilityLabel="Notifications">
          <Bell size={wp(20)} color={colors.white} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default memo(HomeHeader);

const styles = StyleSheet.create({
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(20),
    paddingBottom: hp(16),
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
  },
  avatarFallback: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: fp(18),
    fontWeight: '700',
  },
  greetingName: {
    fontSize: fp(17),
    fontWeight: '700',
    color: colors.white,
    lineHeight: fp(22),
  },
  greetingLabel: {
    fontSize: fp(12),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
    marginTop: hp(1),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(10),
  },
  hiddenIconBtn: {
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.6,
  },
  bellBadge: {
    position: 'absolute',
    top: -wp(2),
    right: -wp(4),
    minWidth: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  bellBadgeText: {
    fontSize: fp(8),
    fontWeight: '700',
    color: colors.white,
  },
});