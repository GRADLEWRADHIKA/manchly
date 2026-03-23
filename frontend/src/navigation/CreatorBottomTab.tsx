import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import WalletCreator from '../screens/Auth/Wallet/WalletCreator';
import {
  MessageCircle,
  ShoppingCart,
  House,
  UserPen,
  WalletMinimal,
  Presentation,
} from 'lucide-react-native';
import CreatorHome from '../screens/Auth/Creator/Home/CreatorHome';
import CreatorChat from '../screens/Auth/Creator/Chat/CreatorChat';
import CreatorView from '../screens/Auth/Creator/Products/Course/CreatorView';
import CreatorSetting from '../screens/Auth/Creator/Settings/CreatorSetting';
import CreatorWebinar from '../screens/Auth/Creator/Webinar/CreatorWebinar';

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
    Icon: ShoppingCart,
  },
  {
    name: 'CreatorChat',
    component: CreatorChat,
    label: 'Chats',
    Icon: MessageCircle,
  },
  {
    name: 'CreatorWebinar',
    component: CreatorWebinar,
    label: 'Webinar',
    Icon: Presentation,
  },
  {
    name: 'CreatorSetting',
    component: CreatorSetting,
    label: 'Profile',
    Icon: UserPen,
  },
];

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tabInfo = tabs.find(t => t.name === route.name);
        const Icon = tabInfo?.Icon ?? MessageCircle;

        const onPress = () => {
          if (!isFocused) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Icon
              size={isFocused ? 26 : 20}
              color={isFocused ? colors.white : colors.muted}
              strokeWidth={isFocused ? 2.2 : 1.8}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.white : colors.muted,
                  fontWeight: isFocused ? '700' : '400',
                },
              ]}
            >
              {tabInfo?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.primary,
    height: hp(78),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderColor,
    paddingBottom: Platform.select({ ios: hp(12), android: hp(10) }),
    paddingTop: hp(10),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(6),
    flex: 1,
  },
  tabLabel: {
    fontSize: fp(10),
    fontWeight: '600',
  },
});
