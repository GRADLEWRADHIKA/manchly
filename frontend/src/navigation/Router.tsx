import { StyleSheet, Text, View } from 'react-native';
import React, { useLayoutEffect } from 'react';
import MainStack from './MainStack';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import { useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getAccessToken } from '../utils/AxiosInstance';
getAccessToken

const Router = () => {
  const { token } = useSelector((state: any) => state.userReducer);
  
    useLayoutEffect(() => {
      getAccessToken();
    }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {token ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router;

const styles = StyleSheet.create({});
