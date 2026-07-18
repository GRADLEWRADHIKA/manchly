// UserBottomTab.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import ProductsScreen from '../screens/Auth/User/Products/ProductsScreen';
import PurchasesScreen from '../screens/Auth/User/Purchase/PurchasesScreen';
import {
  House,
  Compass,
  MonitorPlay,
  BookOpen,
  User,
} from 'lucide-react-native';
import UserHome from '../screens/Auth/User/Home/UserHome';
import UserSessions from '../screens/Auth/User/Sessions/UserSessions';
import UserSetting from '../screens/Auth/User/Settings/UserSetting';
import { canAccessMarketplace } from '../utils/marketplaceUtils';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

//const INACTIVE_COLOR = '#94a3b8';



const tabs = [
  { name: 'Home', component: UserHome, label: 'Home', Icon: House },
  {
    name: 'ProductsScreen',
    component: ProductsScreen,
    label: 'Explore',
    Icon: Compass,
  },
  {
    name: 'UserSessions',
    component: UserSessions,
    label: 'Sessions',
    Icon: MonitorPlay,
  },
  {
    name: 'PurchasesScreen',
    component: PurchasesScreen,
    label: 'My Learning',
    Icon: BookOpen,
  },
  {
    name: 'UserSetting',
    component: UserSetting,
    label: 'Profile',
    Icon: User,
  },
];

const TabItem = ({ isFocused, icon: Icon, label, onPress }: any) => {
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isFocused]);

  const iconTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const iconScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pillOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const pillScaleX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const pillScaleY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && styles.tabItemPressed,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      {/* Active pill background */}
      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: pillOpacity,
            transform: [{ scaleX: pillScaleX }, { scaleY: pillScaleY }],
          },
        ]}
      />

      <Animated.View
        style={{
          transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
        }}
      >
        <Icon
          size={wp(21)}
          color={isFocused ? colors.info : colors.textPrimary}
          strokeWidth={isFocused ? 2.2 : 1.6}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.info : colors.textPrimary,
            fontWeight: isFocused ? '600' : '400',
            opacity: isFocused ? 1 : 0.85,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const CustomTabBar = ({ state, navigation, canShowMarketplace }: any) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, hp(8));
  const visibleRoutes = state.routes.filter(
    (route: any) => route.name !== 'BrandMarketplace' || canShowMarketplace,
  );

  return (
    <View
      style={[
        styles.tabBarOuter,
        { paddingBottom: bottomPadding },
      ]}
    >
      <View style={styles.tabContainer}>
        {visibleRoutes.map((route: any) => {
          const routeIndex = state.routes.findIndex(
            (stateRoute: any) => stateRoute.key === route.key,
          );
          const isFocused = state.index === routeIndex;
          const tabInfo = tabs.find(t => t.name === route.name);
          const Icon = tabInfo?.Icon ?? House;

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
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
  const { user } = useSelector((state: any) => state.userReducer);
  const canShowMarketplace = canAccessMarketplace(user);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={props => (
        <CustomTabBar
          {...props}
          canShowMarketplace={canShowMarketplace}
        />
      )}
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
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.bg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: hp(8),
    paddingHorizontal: wp(4),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: hp(6),
    minHeight: hp(52),
  },
  tabItemPressed: {
    opacity: 0.6,
  },
  activePill: {
    position: 'absolute',
    top: hp(2),
    width: wp(52),
    height: hp(34),
    borderRadius: wp(16),
    backgroundColor: colors.surface,
  },
  tabLabel: {
    fontSize: fp(10.5),
    marginTop: hp(2),
    letterSpacing: 0.1,
  },
});
