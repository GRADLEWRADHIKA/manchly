import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../theme/colors';
import ChatsScreen from '../screens/UnAuth/ChatsScreen';
import ProductsScreen from '../screens/UnAuth/ProductsScreen';
import HomeScreen from '../screens/UnAuth/HomeScreen';
import ProfileScreen from '../screens/UnAuth/ProfileScreen';
import {
  MessageCircle,
  ShoppingCart,
  ShoppingBag,
  Settings as SettingsIcon,
  House,
  UserPen,
} from 'lucide-react-native';
import PurchasesScreen from '../screens/UnAuth/PurchasesScreen';

type TabName = 'Home' | 'Chats' | 'MyProducts' | 'MyPurchases' | 'Settings';

const Tab = createBottomTabNavigator();

const tabs: {
  name: TabName;
  component: React.ComponentType<any>;
  label: string;
  Icon: any;
}[] = [
  {
    name: 'Home',
    component: HomeScreen,
    label: 'Home',
    Icon: House,
  },
  {
    name: 'MyProducts',
    component: ProductsScreen,
    label: 'Products',
    Icon: ShoppingCart,
  },
  {
    name: 'Chats',
    component: ChatsScreen,
    label: 'Chats',
    Icon: MessageCircle,
  },
  {
    name: 'MyPurchases',
    component: PurchasesScreen,
    label: 'Purchases',
    Icon: ShoppingBag,
  },
  {
    name: 'Settings',
    component: ProfileScreen,
    label: 'Profile',
    Icon: UserPen,
  },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const label: string =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? (options.title as string)
            : route.name;

        const Icon =
          tabs.find(t => t.name === (route.name as TabName))?.Icon ??
          MessageCircle;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
          >
            <Icon size={isFocused ? 22 : 20} color={isFocused ? colors.primary : colors.black} />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.primary : colors.black },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const BottomTab = () => {
  return (
    <Tab.Navigator
      initialRouteName="MyPurchases"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
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

export default BottomTab;

const TAB_HEIGHT = 78;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background,
    height: TAB_HEIGHT,
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
