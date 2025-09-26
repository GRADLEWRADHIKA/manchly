import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ProfileScreen from '../screens/UnAuth/ProfileScreen';

const Stack = createNativeStackNavigator();

const screens = [
  {
    name: 'LoginScreen',
    component: LoginScreen,
  },
  {
    name: 'OTPScreen',
    component: OTPScreen,
  }
];

const AuthStack = () => {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      {screens.map((item, index) => {
        return (
          <Stack.Screen
            key={index}
            name={item.name}
            component={item.component}
            options={{
              headerShown: false,
            }}
          />
        );
      })}
    </Stack.Navigator>
  );
};

export default AuthStack;
