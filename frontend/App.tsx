import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/CustomToast';
import Router from './src/navigation/Router';
import { PaperProvider } from 'react-native-paper';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/Store';

import { injectStore } from './src/utils/AxiosInstance';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeChottuLink } from 'react-native-chottulink-sdk';
import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';
import SplashScreen from 'react-native-splash-screen';
import OtaUpdateGate from './src/components/OtaUpdateGate';


function App() {
  injectStore(store);
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initializeChottuLink('c_app_Xn5WbBZdEmObUbFRf8D91YiM3ZLD2CO6');
    Settings.initializeSDK();
    AppEventsLogger.logEvent('fb_mobile_activate_app');

    // Hide native splash after 2.5 seconds
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['bottom']}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <PaperProvider>
                <StatusBar
                  translucent={false}
                  backgroundColor="#000000"
                  barStyle="light-content"
                />
                <Router />
                <Toast config={toastConfig} position="top" topOffset={60} />
              </PaperProvider>
            </PersistGate>
          </Provider>
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function Root() {
  return (
    <OtaUpdateGate>
      <App />
    </OtaUpdateGate>
  );
}
