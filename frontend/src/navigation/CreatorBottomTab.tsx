import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import {
  House,
  ShoppingBag,
  Clapperboard,
  LayoutGrid,
  User,
} from "lucide-react-native";
import CreatorHome from '../screens/Auth/Creator/Home/CreatorHome';
import CreatorProducts from '../screens/Auth/Creator/Products/CreatorProducts';
import CreatorSetting from '../screens/Auth/Creator/Settings/CreatorSetting';
//import CreatorAI from '../screens/Auth/Creator/Ai/CreatorAI';
//import Dashboard from '../screens/Auth/Profile/Dashboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { instance } from '../utils/AxiosInstance';
//import TrialBottomSheet from '../screens/Auth/Creator/Home/TrialBottomSheet';
import ReelsScreen from '../screens/Auth/Creator/Reels/ReelScreen';
import CreatorDashboardOverview from '../screens/Auth/Creator/CreatorDashboardOverview';

const Tab = createBottomTabNavigator();

const tabs = [
  {
    name: 'Home',
    component: CreatorHome,
    label: 'Home',
    Icon: House,
  },
  {
    name: 'ProductsScreen',
    component: CreatorProducts,
    label: 'Products',
    Icon: ShoppingBag,
  },
  {
    name: 'ReelsTab',
    component: ReelsScreen,
    label: 'Reels',
    Icon: Clapperboard,
  },
  {
    name: 'DashboardTab',
    component: CreatorDashboardOverview,
    label: 'Stats',
    Icon: LayoutGrid,
  },
  {
    name: 'CreatorSetting',
    component: CreatorSetting,
    label: 'Profile',
    Icon: User,
  },
];

const TabItem = ({ isFocused, icon: Icon, label, onPress }: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      <Icon
        size={wp(22)}
        color={isFocused ? '#D69C40' : colors.muted}
        strokeWidth={isFocused ? 2.2 : 1.6}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? '#D69C40' : colors.muted },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.tabBarOuter, { paddingBottom: insets.bottom || hp(6) }]}
    >
      <View style={styles.tabContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const tabInfo = tabs.find(t => t.name === route.name);

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          const Icon = tabInfo?.Icon ?? House;

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

const CreatorBottomTab = () => {
  const [showTrial, setShowTrial] = useState(true);
  const [trialConfig, setTrialConfig] = useState({
    trialDays: 3,
    trialPrice: 199,
    monthlyPrice: 199,
  });

  const { token } = useSelector((state: any) => state.userReducer);

  useEffect(() => {
    if (!token) return;
    instance
      .get('creator-trial/status')
      .then(res => {
        const data = res?.data?.data;
        if (!data?.has_active) {
          setTrialConfig({
            trialDays: data?.trial_days || 3,
            trialPrice: data?.trial_price || 199,
            monthlyPrice: data?.monthly_price || 199,
          });
          setShowTrial(true);
        }
      })
      .catch(() => {
        // If API fails, don't block the app
      });
  }, [token]);

  return (
    <>
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

      
    </>
  );
};

export default CreatorBottomTab;

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: hp(60),
    paddingTop: hp(8),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: hp(4),
  },
  tabLabel: {
    fontSize: fp(10),
    letterSpacing: 0.2,
  },
});