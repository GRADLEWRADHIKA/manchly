import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@fcm_token';
const CALL_CHANNEL_ID = 'incoming_calls';

class NotificationService {
  /**
   * Request notification permission (Android 13+)
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  /**
   * Get FCM token and store in AsyncStorage
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored FCM token from AsyncStorage
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(FCM_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Remove FCM token from AsyncStorage and unregister from FCM
   */
  async removeToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    } catch (error) {
    }
  }

  /**
   * Listen for token refresh and update AsyncStorage
   */
  onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh(async (newToken) => {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      callback(newToken);
    });
  }

  /**
   * Create notification channels for Android
   */
  async createChannel() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.createChannel({
      id: CALL_CHANNEL_ID,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'ringtone',
      vibration: true,
    });
  }

  /**
   * Display a local notification using notifee
   */
  async displayNotification(title: string, body: string, data?: any) {
    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
        sound: 'default',
      },
    });
  }

  /**
   * Display a full-screen incoming call notification
   */
  async displayCallNotification(callerName: string, data: any) {
    await notifee.displayNotification({
      title: 'Incoming Video Call',
      body: `${callerName} is calling you`,
      data,
      android: {
        channelId: CALL_CHANNEL_ID,
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

  /**
   * Check if a notification is an incoming call
   */
  isCallNotification(data: any): boolean {
    return data?.type === 'incoming_call';
  }

  /**
   * Handle foreground notifications — show via notifee (skip call type, handled by socket)
   */
  onForegroundMessage() {
    return messaging().onMessage(async (remoteMessage) => {
      // Skip call notifications in foreground — socket handles those
      if (this.isCallNotification(remoteMessage.data)) {
        return;
      }
      await this.displayNotification(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || '',
        remoteMessage.data,
      );
    });
  }

  /**
   * Handle background/quit notification tap
   */
  onNotificationOpenedApp(callback: (message: any) => void) {
    return messaging().onNotificationOpenedApp(callback);
  }

  /**
   * Check if app was opened from a notification (when app was killed)
   */
  async getInitialNotification() {
    return messaging().getInitialNotification();
  }
}

export default new NotificationService();
