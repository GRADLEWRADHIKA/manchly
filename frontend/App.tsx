import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform, View } from 'react-native';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import Router from './src/navigation/Router';
import { PaperProvider } from 'react-native-paper';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/Store';
import SplashScreen from 'react-native-splash-screen';

export default function App() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  
  return (
    <Provider store={store}>
      <PaperProvider>
        <PersistGate loading={null} persistor={persistor}>
          <StatusBar
            translucent={false}
            backgroundColor="white"
            barStyle="dark-content"
          />
          <Router />
          <Toast />
        </PersistGate>
      </PaperProvider>
    </Provider>
  );
}
