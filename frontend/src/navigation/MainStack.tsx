import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTab from './BottomTab';
import Settings from '../screens/UnAuth/Profile/Settings';
import Lists from '../screens/UnAuth/Profile/Lists';
import Earnings from '../screens/UnAuth/Profile/Earnings';
import UserProfile from '../screens/UnAuth/Profile/UserProfile';
import Dashboard from '../screens/UnAuth/Profile/Dashboard';
import SuperThank from '../screens/UnAuth/Profile/SuperThank';
import Wallet from '../screens/UnAuth/Profile/Wallet';
import CreateProducts from '../screens/UnAuth/Product/CreateProducts';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="BottomTab"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="BottomTab" component={BottomTab} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="Lists" component={Lists} />
      <Stack.Screen name="Earnings" component={Earnings} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="SuperThank" component={SuperThank} />
      <Stack.Screen name="Wallet" component={Wallet} />
      <Stack.Screen name="CreateProducts" component={CreateProducts} />
    </Stack.Navigator>
  );
};

export default MainStack;
