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

  if (remoteMessage.data?.type === 'incoming_call') {
    // Show a high-priority call notification
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
  // Regular notifications are displayed automatically by FCM notification payload
  // No need to manually display — Android shows them from the `notification` field
});

// Handle background notifee tap events (deep linking)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === 1 /* PRESS */ && detail.notification?.data) {
    // Navigation will be handled by getInitialNotification when app opens
    // Just dismiss the notification
    if (detail.notification.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
