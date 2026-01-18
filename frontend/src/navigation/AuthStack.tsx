import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/UnAuth/LoginScreen';
import OTPScreen from '../screens/UnAuth/OTPScreen';
import SignupScreen from '../screens/UnAuth/SignUpScreen';
import FirstPage from '../screens/UnAuth/FirstPage';
import NewLoginScreen from '../screens/UnAuth/NewLoginScreen';

export type AuthStackParamList = {
  LoginScreen: undefined;
  OTPScreen: undefined;
  SignupScreen: undefined;
  CheckDataType: undefined;
  FirstPage: undefined;
  NewLoginScreen: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="FirstPage"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="FirstPage" component={FirstPage} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="NewLoginScreen" component={NewLoginScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
