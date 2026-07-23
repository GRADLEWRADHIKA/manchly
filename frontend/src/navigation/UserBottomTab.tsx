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
//import ProductsScreen from '../screens/Auth/User/Products/ProductsScreen';
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
import UserView from '../screens/Auth/User/Products/UserView';
const Tab = createBottomTabNavigator();



const tabs = [
  { name: 'Home', component: UserHome, label: 'Home', Icon: House },
  {
    name: 'UserView',
    component: UserView,
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
    label: 'Learning',
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
      {/* Active glowing indicator bar */}
      <Animated.View
        style={[
          styles.activeBar,
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
          color={isFocused ? colors.uBottomText : '#080C25'}
          strokeWidth={isFocused ? 2.2 : 1.8}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
            fontWeight: isFocused ? '700' : '600',
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
    backgroundColor: '#080C25',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.uBottomText,
    shadowColor: '#080C25',
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
    paddingTop: hp(12),
    paddingBottom: hp(6),
    minHeight: hp(56),
  },
  tabItemPressed: {
    opacity: 0.6,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: wp(44),
    height: hp(5),
    borderRadius: wp(4),
    backgroundColor: colors.uBottomText,
    shadowColor: colors.uBottomText,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  tabLabel: {
    fontSize: fp(10),
    marginTop: hp(4),
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
