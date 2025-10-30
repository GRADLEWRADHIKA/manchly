// UserBottomTab.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../utils/colors';
import HomeScreen from '../screens/UnAuth/Home/HomeScreen';
import ProductsScreen from '../screens/UnAuth/Product/ProductsScreen';
import ChatListScreen from '../screens/UnAuth/Chat/ChatsScreen';
import PurchasesScreen from '../screens/UnAuth/Purchase/PurchasesScreen';
import ProfileScreen from '../screens/UnAuth/Profile/ProfileScreen';
import { MessageCircle, ShoppingCart, ShoppingBag, House, UserPen } from 'lucide-react-native';
import UserHome from '../screens/UnAuth/User/Home/UserHome';

const Tab = createBottomTabNavigator();

const tabs = [
  { name: 'Home', component: UserHome, label: 'Home', Icon: House },
  { name: 'ProductsScreen', component: ProductsScreen, label: 'Products', Icon: ShoppingCart },
  { name: 'ChatListScreen', component: ChatListScreen, label: 'Chats', Icon: MessageCircle },
  { name: 'PurchasesScreen', component: PurchasesScreen, label: 'Purchases', Icon: ShoppingBag },
  { name: 'ProfileScreen', component: ProfileScreen, label: 'Profile', Icon: UserPen },
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
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem}>
            <Icon size={isFocused ? 22 : 20} color={isFocused ? colors.primary : colors.black} />
            <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.black }]}>
              {tabInfo?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ title: t.label }} />
      ))}
    </Tab.Navigator>
  );
};

export default UserBottomTab;

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
