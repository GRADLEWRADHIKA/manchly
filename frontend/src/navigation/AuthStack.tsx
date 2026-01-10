import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/UnAuth/LoginScreen';
import OTPScreen from '../screens/UnAuth/OTPScreen';
import SignupScreen from '../screens/UnAuth/SignUpScreen';
import CheckUserType from '../screens/UnAuth/CheckDataType';
import CheckDatarType from '../screens/UnAuth/CheckDataType';
import CheckDataType from '../screens/UnAuth/CheckDataType';

export type AuthStackParamList = {
  LoginScreen: undefined;
  OTPScreen: undefined;
  SignupScreen: undefined;
  CheckDataType: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="LoginScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
      <Stack.Screen name="CheckDataType" component={CheckDataType} />
    </Stack.Navigator>
  );
};

export default AuthStack;
