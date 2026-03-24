// UserBottomTab.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import ProductsScreen from '../screens/Auth/User/Products/ProductsScreen';
import PurchasesScreen from '../screens/Auth/User/Purchase/PurchasesScreen';
import {
  MessageCircle,
  ShoppingCart,
  ShoppingBag,
  House,
  UserPen,
} from 'lucide-react-native';
import UserHome from '../screens/Auth/User/Home/UserHome';
import UserChat from '../screens/Auth/User/Chat/UserChat';
import UserSetting from '../screens/Auth/User/Settings/UserSetting';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = colors.secPrimary;
const INACTIVE_COLOR = '#94a3b8';
const ACTIVE_BG = '#1E3A5F15';
const ACCENT = colors.secPrimary;

const tabs = [
  { name: 'Home', component: UserHome, label: 'Home', Icon: House },
  {
    name: 'ProductsScreen',
    component: ProductsScreen,
    label: 'Products',
    Icon: ShoppingCart,
  },
  {
    name: 'UserChat',
    component: UserChat,
    label: 'Chats',
    Icon: MessageCircle,
  },
  {
    name: 'PurchasesScreen',
    component: PurchasesScreen,
    label: 'Purchases',
    Icon: ShoppingBag,
  },
  {
    name: 'UserSetting',
    component: UserSetting,
    label: 'Profile',
    Icon: UserPen,
  },
];

const TabItem = ({ isFocused, icon: Icon, label, onPress }: any) => {
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  }, [isFocused]);

  const iconScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const pillOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const pillScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      {/* Active pill background */}
      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: pillOpacity,
            transform: [{ scale: pillScale }],
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Icon
          size={wp(22)}
          color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
          strokeWidth={isFocused ? 2.4 : 1.6}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
            fontWeight: isFocused ? '700' : '400',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Active dot indicator */}
      {isFocused && (
        <Animated.View
          style={[
            styles.activeDot,
            { opacity: pillOpacity, transform: [{ scale: pillScale }] },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, navigation }: any) => {
  return (
    <View style={styles.tabBarOuter}>
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const tabInfo = tabs.find(t => t.name === route.name);
          const Icon = tabInfo?.Icon ?? MessageCircle;

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              icon={Icon}
              label={tabInfo?.label}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const UserBottomTab = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      {tabs.map(t => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={{ title: t.label }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default UserBottomTab;

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: hp(68),
    paddingBottom: Platform.select({ ios: hp(10), android: hp(6) }),
    paddingTop: hp(8),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: hp(4),
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: wp(48),
    height: wp(36),
    borderRadius: wp(14),
    backgroundColor: ACTIVE_BG,
    borderWidth: 1,
    borderColor: '#1E3A5F20',
  },
  tabLabel: {
    fontSize: fp(10),
    marginTop: hp(3),
  },
  activeDot: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: ACCENT,
    marginTop: hp(3),
  },
});
