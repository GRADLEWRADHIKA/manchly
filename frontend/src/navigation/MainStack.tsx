import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawer from './CustomDrawer';
import BottomTab from './BottomTab';
import ChatsScreen from '../screens/UnAuth/ChatsScreen';
import ProductsScreen from '../screens/UnAuth/ProductsScreen';
import HomeScreen from '../screens/UnAuth/HomeScreen';
import ProfileScreen from '../screens/UnAuth/ProfileScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const HomeDrawer = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Main"
      drawerContent={props => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'left',
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen name="Main" component={BottomTab} />
    </Drawer.Navigator>
  );
};

const MainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeDrawer"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeDrawer" component={HomeDrawer} />
      <Stack.Screen name="ChatsScreen" component={ChatsScreen} />
      <Stack.Screen name="ProductsScreen" component={ProductsScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;
