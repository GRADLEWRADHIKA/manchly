import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import {
  House,
  ShoppingBag,
  Bot,
  LayoutGrid,
  User,
} from "lucide-react-native";
import CreatorHome from '../screens/Auth/Creator/Home/CreatorHome';
import CreatorView from '../screens/Auth/Creator/Products/Course/CreatorView';
import CreatorSetting from '../screens/Auth/Creator/Settings/CreatorSetting';
import CreatorWebinar from '../screens/Auth/Creator/Webinar/CreatorWebinar';
import CreateProducts from '../screens/Auth/Creator/Products/Course/CreateProducts';
//import CreatorCenter from '../screens/Auth/Creator/CreatorCenter/CreatorCenter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    component: CreatorView,
    label: 'Products',
    Icon: ShoppingBag,
  },
  {
    name: 'CreateProducts',
    component: CreateProducts,
    label: 'AI',
    Icon: Bot,
  },
  {
    name: 'CreatorWebinar',
    component: CreatorWebinar,
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
        color={isFocused ? colors.golden : colors.muted}
        strokeWidth={isFocused ? 2.2 : 1.6}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.golden : colors.muted },
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