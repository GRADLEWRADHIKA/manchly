import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import Router from './src/navigation/Router';
import { PaperProvider } from 'react-native-paper';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/Store';

import { injectStore } from './src/utils/AxiosInstance';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeChottuLink } from 'react-native-chottulink-sdk';
import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';

export default function App() {
  injectStore(store);
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initializeChottuLink('c_app_Xn5WbBZdEmObUbFRf8D91YiM3ZLD2CO6');
    Settings.initializeSDK();
    AppEventsLogger.logEvent('fb_mobile_activate_app');
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <PaperProvider>
                <StatusBar
                  translucent={false}
                  backgroundColor={isDarkMode ? '#000' : '#fff'}
                  barStyle={isDarkMode ? 'light-content' : 'light-content'}
                />
                <Router />
                <Toast />
              </PaperProvider>
            </PersistGate>
          </Provider>
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
