import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import {
  House,
  UserPen,
  ShoppingBag,
  LayoutDashboard,
  Plus,
} from 'lucide-react-native';
import CreatorHome from '../screens/Auth/Creator/Home/CreatorHome';
import CreatorProducts from '../screens/Auth/Creator/Products/CreatorProducts';
import CreatorSetting from '../screens/Auth/Creator/Settings/CreatorSetting';
import Dashboard from '../screens/Auth/Profile/Dashboard';
import CreateProducts from '../screens/Auth/Creator/Products/Course/CreateProducts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const TAB_ACCENT = '#60A5FA';

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
    name: 'CreateProducts',
    component: CreateProducts,
    label: 'Create',
    Icon: Plus,
    isCenter: true,
  },
  {
    name: 'Dashboard',
    component: Dashboard,
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    name: 'CreatorSetting',
    component: CreatorSetting,
    label: 'Profile',
    Icon: UserPen,
  },
];

const TabItem = ({ isFocused, icon: Icon, label, onPress }: any) => {
  const accent = TAB_ACCENT;
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.spring(bounce, {
          toValue: 0.85,
          useNativeDriver: true,
          friction: 3,
          tension: 200,
        }),
        Animated.spring(bounce, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
          tension: 100,
        }),
      ]).start();
    }

    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 100,
    }).start();
  }, [isFocused]);

  const iconTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -hp(3)],
  });

  const pillOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const pillScaleX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const pillScaleY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const labelOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const glowOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: accent,
            opacity: glowOpacity,
            transform: [{ scaleX: pillScaleX }, { scaleY: pillScaleY }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: pillOpacity,
            transform: [{ scaleX: pillScaleX }, { scaleY: pillScaleY }],
            borderColor: accent + '40',
          },
        ]}
      />

      <Animated.View
        style={{
          transform: [{ translateY: iconTranslateY }, { scale: bounce }],
        }}
      >
        <Icon
          size={wp(isFocused ? 23 : 21)}
          color={isFocused ? accent : colors.cTextMuted}
          strokeWidth={isFocused ? 2.4 : 1.5}
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? colors.cText : colors.cTextMuted,
            fontWeight: isFocused ? '700' : '400',
            opacity: labelOpacity,
            transform: [{ translateY: iconTranslateY }],
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      <Animated.View
        style={[
          styles.activeLine,
          {
            backgroundColor: accent,
            opacity: pillOpacity,
            transform: [{ scaleX: pillScaleX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const CenterButton = ({ onPress }: { onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
        friction: 3,
        tension: 200,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 100,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.centerBtnWrap}
    >
      <Animated.View
        style={[styles.centerBtn, { transform: [{ scale: scaleAnim }] }]}
      >
        <Plus size={wp(28)} color={colors.white} strokeWidth={2.5} />
      </Animated.View>
      <Animated.Text style={styles.centerLabel}></Animated.Text>
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

          if (tabInfo?.isCenter) {
            return <CenterButton key={route.key} onPress={onPress} />;
          }

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
      sceneContainerStyle={{ backgroundColor: colors.white }}
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
    backgroundColor: '#152238',
    shadowColor: '#0F3460',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: '#16213E',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: hp(60),
    paddingTop: hp(6),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  glow: {
    position: 'absolute',
    top: -hp(2),
    width: wp(52),
    height: wp(52),
    borderRadius: wp(14),
  },
  activePill: {
    position: 'absolute',
    top: hp(0),
    width: wp(50),
    height: wp(42),
    borderRadius: wp(16),
    backgroundColor: '#16213E',
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: fp(9.5),
    marginTop: hp(2),
    letterSpacing: 0.2,
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    width: wp(20),
    height: hp(3),
    borderRadius: hp(1.5),
  },

  centerBtnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -hp(20),
  },
  centerBtn: {
    width: wp(52),
    height: wp(52),
    borderRadius: wp(16),
    backgroundColor: '#0F3460',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F3460',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerLabel: {
    fontSize: fp(9.5),
    color: colors.cTextMuted,
    marginTop: hp(2),
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
