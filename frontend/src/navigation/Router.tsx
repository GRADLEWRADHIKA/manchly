import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import { useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserMainStack from './UserMainStack';
import CreatorMainStack from './CreatorMainStack';

const Router = () => {
  const { token } = useSelector((state: any) => state.userReducer);
  const { user } = useSelector((state: any) => state.userReducer);



  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {token ? (
          user?.user_type === 'USER' ? (
            <UserMainStack />
          ) : (
            <CreatorMainStack />
          )
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router;

const styles = StyleSheet.create({});
