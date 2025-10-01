import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { bootstrapAuth } from './src/store/authSlice';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import { useAppSelector, useAppDispatch } from './src/store/hooks';
import { SafeAreaProvider } from 'react-native-safe-area-context';

enableScreens();

function RootNavigatorGate() {
  const dispatch = useAppDispatch();
  const { initializing, isLoggedIn } = useAppSelector(s => s.auth);
  const userType = useAppSelector(state => state.auth.userType);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isLoggedIn ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <StatusBar backgroundColor={'black'} barStyle={'light-content'} />
      <RootNavigatorGate />
    </Provider>
  );
}
