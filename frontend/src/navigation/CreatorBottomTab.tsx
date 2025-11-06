// CreatorBottomTab.tsx
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
import ProductsScreen from '../screens/UnAuth/User/Products/ProductsScreen';
import WalletCreator from '../screens/UnAuth/Wallet/WalletCreator';
import ProfileScreen from '../screens/UnAuth/Profile/ProfileScreen';
import {
  MessageCircle,
  ShoppingCart,
  House,
  UserPen,
  WalletMinimal,
} from 'lucide-react-native';
import CreatorHome from '../screens/UnAuth/Creator/Home/CreatorHome';
import CreatorChat from '../screens/UnAuth/Creator/Chat/CreatorChat';
import CreatorView from '../screens/UnAuth/Creator/Products/CreatorView';

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
    name: 'WalletCreator',
    component: WalletCreator,
    label: 'Wallet',
    Icon: WalletMinimal,
  },
  {
    name: 'ProfileScreen',
    component: ProfileScreen,
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
              size={isFocused ? 24 : 20}
              color={isFocused ? colors.primary : colors.black}
              strokeWidth={isFocused ? 2.2 : 1.8}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.primary : colors.black,
                  fontWeight: isFocused ? '600' : '400',
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
    backgroundColor: colors.white,
    height: 78,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderColor,
    paddingBottom: Platform.select({ ios: 12, android: 10 }),
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
