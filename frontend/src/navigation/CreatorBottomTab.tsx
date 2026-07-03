import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  House,
  BookOpen,
  Sparkles,
  BarChart2,
  User,
} from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import CreatorHome from '../screens/Auth/Creator/Home/CreatorHome';
//import CreatorView from '../screens/Auth/Creator/Products/Course/CreatorView';
import CreatorSetting from '../screens/Auth/Creator/Settings/CreatorSetting';
import StatsScreen from '../screens/Auth/Creator/Stats/StatsScreen';
import AskManchlyAI from '../screens/Auth/Creator/Ai/CreatorAI';
//import CreateCourse  from '../screens/Auth/Creator/Products/Course/CreateCourse';
import ProductsHub from '../screens/Auth/Creator/ProductHub/ProductHub';
const Tab = createBottomTabNavigator();

const tabs = [
  {
    name: 'Home',
    component: CreatorHome,
    label: 'Home',
    Icon: House,
  },
  {
    name: 'ProductsHub',
    component: ProductsHub,
    label: 'Products',
    Icon: BookOpen,
  },
  {
    name: 'AskManchkyAI',
    component: AskManchlyAI,
    label: 'AI',
    Icon: Sparkles,
  },
  {
    name: 'CreatorWebinar',
    component: StatsScreen,
    label: 'Stats',
    Icon: BarChart2,
  },
  {
    name: 'CreatorSetting',
    component: CreatorSetting,
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

  const iconScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.tabItem}
    >
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Icon
          size={22}
          color={isFocused ? colors.gold : colors.textSecondary}
          strokeWidth={isFocused ? 2.4 : 1.8}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.gold : colors.textSecondary,
            fontWeight: isFocused ? '500' : '400',
          },
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
  const bottomPadding = Math.max(insets.bottom, hp(8));

  return (
    <View
      style={[
        styles.tabBarOuter,
        { paddingBottom: bottomPadding },
      ]}
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
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: hp(54),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    paddingTop: hp(4),
  },
  tabLabel: {
    fontSize: 10,
    marginTop: hp(3),
    letterSpacing: 0.1,
  },
});
