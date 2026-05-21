/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Handle background/quit state FCM messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message:', remoteMessage);

  // Show a high-priority call notification when app is killed/background
  if (remoteMessage.data?.type === 'incoming_call') {
    const callerName = remoteMessage.data.callerName || 'Expert';

    await notifee.createChannel({
      id: 'incoming_calls',
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibration: true,
    });

    await notifee.displayNotification({
      title: 'Incoming Video Call',
      body: `${callerName} is calling you`,
      data: remoteMessage.data,
      android: {
        channelId: 'incoming_calls',
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.CALL,
        smallIcon: 'ic_launcher',
        sound: 'ringtone',
        fullScreenAction: {
          id: 'incoming_call',
        },
        pressAction: {
          id: 'incoming_call',
        },
        ongoing: true,
        autoCancel: false,
      },
    });
  }
});

// Handle background notification events from notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);
});

AppRegistry.registerComponent(appName, () => App);
