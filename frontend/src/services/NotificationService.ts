import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@fcm_token';

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
   * Create default notification channel for Android
   */
  async createChannel() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
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
   * Handle foreground notifications — show via notifee
   */
  onForegroundMessage() {
    return messaging().onMessage(async (remoteMessage) => {
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
