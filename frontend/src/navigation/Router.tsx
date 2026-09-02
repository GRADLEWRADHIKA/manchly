import { Linking } from 'react-native';
import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
} from '@react-navigation/native';
import AuthStack from './AuthStack';
import { useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UserMainStack from './UserMainStack';
import CreatorMainStack from './CreatorMainStack';
import {
  initAppsFlyer,
  extractDeepLinkFromUrl,
  parseDeepLinkValue,
  DeepLinkDestination,
} from '../services/AppsFlyerService';
import appsFlyer from 'react-native-appsflyer';
import NotificationService from '../services/NotificationService';
import notifee, { EventType } from '@notifee/react-native';
import { store } from '../store/Store';
import { updateProfile, getCurrentUser } from '../store/UserSlice';
import { getUnreadCount, addRealtimeNotification } from '../store/NotificationSlice';
import SocketService from '../services/SocketService';
import CallListener, { setNavigationRef } from '../components/CallListener';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { navigationRef } from './navigationRef';

const PREFIXES = ['https://manchly.onelink.me', 'http://manchly.onelink.me', 'manchly://'];

// Module-level flag so the static linking object can check auth state
let isAuthenticated = false;

// Rebuild a resolved URL so it uses our registered prefix
const ensurePrefix = (url: string): string => {
  const match = url.match(/\/(course|webinar)\/([^/?#]+)/);
  if (match) {
    return `https://manchly.onelink.me/${match[1]}/${match[2]}`;
  }
  return url;
};

const linking = {
  prefixes: PREFIXES,
  config: {
    screens: {
      CourseDetailsScreen: 'course/:courseId',
      WebinarDetails: 'webinar/:webinarId',
    },
  },
  async getInitialURL(): Promise<string | null> {
    const url = await Linking.getInitialURL();
    // Read token directly from store (PersistGate ensures rehydration before Router mounts)
    const token = store.getState().userReducer?.token;
    if (!token) return null;
    if (!url) return null;
    if (/\/(course|webinar)\/[^/?#]+/.test(url)) return ensurePrefix(url);
    return url;
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      // Only let React Navigation handle when authenticated
      if (!isAuthenticated) return;
      if (/\/(course|webinar)\/[^/?#]+/.test(url)) {
        listener(ensurePrefix(url));
      } else {
        listener(url);
      }
    });
    return () => subscription.remove();
  },
};

const navigateFromNotification = (data: any) => {
  if (!navigationRef.current?.isReady()) return;
  // FCM data has payload as stringified JSON
  let parsed = data;
  if (typeof data?.payload === 'string') {
    try { parsed = JSON.parse(data.payload); } catch {}
  }
  // Notifee data may already have the fields directly
  if (parsed?.courseId) {
    navigationRef.current?.navigate('CourseDetailsScreen', { courseId: parsed.courseId });
  } else if (parsed?.webinarId) {
    navigationRef.current?.navigate('WebinarDetails', { webinarId: parsed.webinarId, id: parsed.webinarId });
  } else if (parsed?.sessionId) {
    navigationRef.current?.navigate('SessionDetails', { sessionId: parsed.sessionId });
  }
};

const navigateToIncomingCall = (data: any) => {
  if (!navigationRef.current?.isReady()) return;
  const currentRoute = navigationRef.current?.getCurrentRoute?.();
  if (currentRoute?.name === 'CallScreen' || currentRoute?.name === 'IncomingCallScreen') return;

  navigationRef.current?.navigate('IncomingCallScreen', {
    callID: data.callId,
    sessionId: data.sessionId,
    mode: data.mode || 'video',
    callerName: data.callerName || 'Expert',
    callerImage: data.callerImage,
    callerId: data.callerId,
  });
};

const Router = () => {
  const { token } = useSelector((state: any) => state.userReducer);
  const { user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<any>();
  const userRole = String(user?.user_type || '').toUpperCase();
  const pendingDeepLink = useRef<DeepLinkDestination>(null);
  const pendingCallData = useRef<any>(null);
  const pendingNotificationData = useRef<any>(null);

  // Initialize AppsFlyer SDK
  useEffect(() => {
    initAppsFlyer();
  }, []);

  // Keep module-level auth flag in sync + refresh user data on app open
  useEffect(() => {
    isAuthenticated = !!token;
    if (token) {
      dispatch(getCurrentUser());
      dispatch(getUnreadCount());
    }
  }, [token]);

  // AppsFlyer deep link listener (Unified Deep Linking)
  useEffect(() => {
    const onDeepLink = appsFlyer.onDeepLink((res: any) => {
      if (res?.deepLinkStatus === 'NOT_FOUND') return;

      const deepLinkValue = res?.data?.deep_link_value;
      const destination = deepLinkValue
        ? parseDeepLinkValue(deepLinkValue)
        : extractDeepLinkFromUrl(res?.data?.af_dp || '');

      if (!destination) return;

      if (!isAuthenticated) {
        pendingDeepLink.current = destination;
        return;
      }

      setTimeout(() => {
        if (destination.screen === 'CourseDetailsScreen') {
          navigationRef.current?.navigate('CourseDetailsScreen', {
            courseId: destination.id,
          });
        } else {
          navigationRef.current?.navigate('WebinarDetails', {
            webinarId: destination.id,
            id: destination.id,
          });
        }
      }, 500);
    });

    return () => {
      onDeepLink?.();
    };
  }, []);

  // Socket listeners for real-time events
  useEffect(() => {
    if (!token) return;

    const handleNewNotification = (notification: any) => {
      dispatch(addRealtimeNotification(notification));
    };

    const handleUserStatus = (data: { userId: string; status: string }) => {
      if (data.status === 'online') {
        SocketService.setUserOnline(data.userId);
      } else {
        SocketService.setUserOffline(data.userId);
      }
    };

    const handleSocketError = (data: { message: string }) => {
      console.warn('Socket error:', data.message);
    };

    // Device-limited login (Feature #2): backend pushes this when THIS device's
    // session is evicted by a login on another device. Log out immediately and
    // show a clear reason — no waiting for the next API call.
    const handleForceLogout = (data: { message?: string }) => {
      Toast.show({
        type: 'error',
        text1: 'Logged out',
        text2:
          data?.message || 'Your account was signed in on another device.',
        position: 'top',
        visibilityTime: 5000,
      });
      dispatch({ type: 'User/logout' });
    };

    SocketService.on('new_notification', handleNewNotification);
    SocketService.on('user_status', handleUserStatus);
    SocketService.on('error', handleSocketError);
    SocketService.on('force_logout', handleForceLogout);

    return () => {
      SocketService.off('new_notification', handleNewNotification);
      SocketService.off('user_status', handleUserStatus);
      SocketService.off('error', handleSocketError);
      SocketService.off('force_logout', handleForceLogout);
    };
  }, [token]);

  // Setup FCM notifications
  useEffect(() => {
    const setupNotifications = async () => {
      await NotificationService.requestPermission();
      await NotificationService.createChannel();
      const fcmToken = await NotificationService.getToken();
      if (fcmToken && token) {
        dispatch(updateProfile({ fcm_token: fcmToken }));
      }
    };

    setupNotifications();

    // Foreground notification — displayed via notifee (calls are handled by socket)
    const unsubForeground = NotificationService.onForegroundMessage();

    // Background notification tap handler (FCM)
    const unsubOpened = NotificationService.onNotificationOpenedApp(
      (remoteMessage) => {
        if (NotificationService.isCallNotification(remoteMessage.data)) {
          navigateToIncomingCall(remoteMessage.data);
        } else {
          navigateFromNotification(remoteMessage.data);
        }
        dispatch(getUnreadCount());
      },
    );

    // Foreground notifee tap handler
    const unsubNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        const data = detail.notification.data;
        if (NotificationService.isCallNotification(data)) {
          navigateToIncomingCall(data);
        } else {
          navigateFromNotification(data);
        }
        dispatch(getUnreadCount());
      }
    });

    // Check if app was opened from a killed state notification
    NotificationService.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        if (NotificationService.isCallNotification(remoteMessage.data)) {
          pendingCallData.current = remoteMessage.data;
        } else {
          // Store for later navigation after mount
          pendingNotificationData.current = remoteMessage.data;
        }
      }
    });

    // Token refresh listener
    const unsubTokenRefresh = NotificationService.onTokenRefresh((newToken) => {
      if (token) {
        dispatch(updateProfile({ fcm_token: newToken }));
      }
    });

    return () => {
      unsubForeground();
      unsubOpened();
      unsubNotifee();
      unsubTokenRefresh();
    };
  }, [token]);

  // Handle pending call/notification data after navigation is ready
  useEffect(() => {
    if (token && user) {
      if (pendingCallData.current) {
        const data = pendingCallData.current;
        pendingCallData.current = null;
        setTimeout(() => navigateToIncomingCall(data), 1000);
      }
      if (pendingNotificationData.current) {
        const data = pendingNotificationData.current;
        pendingNotificationData.current = null;
        setTimeout(() => navigateFromNotification(data), 1000);
      }
    }
  }, [token, user]);

  // Handle deep link when user is not authenticated — save it for after login
  useEffect(() => {
    if (!token) {
      Linking.getInitialURL().then((url) => {
        if (!url) return;
        const destination = extractDeepLinkFromUrl(url);
        if (destination) {
          pendingDeepLink.current = destination;
        }
      });

      const subscription = Linking.addEventListener('url', ({ url }) => {
        const destination = extractDeepLinkFromUrl(url);
        if (destination) {
          pendingDeepLink.current = destination;
        }
      });

      return () => subscription.remove();
    }
  }, [token]);

  // After login, navigate to the pending deep link destination
  useEffect(() => {
    if (token && user && pendingDeepLink.current) {
      const destination = pendingDeepLink.current;
      pendingDeepLink.current = null;

      setTimeout(() => {
        if (destination.screen === 'CourseDetailsScreen') {
          navigationRef.current?.navigate('CourseDetailsScreen', {
            courseId: destination.id,
          });
          return;
        }

        navigationRef.current?.navigate('WebinarDetails', {
          webinarId: destination.id,
          id: destination.id,
        });
      }, 800);
    }
  }, [token, user]);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={(ref) => {
          (navigationRef as any).current = ref;
          setNavigationRef(ref);
        }}
        linking={linking}>
        {token ? (
          <>
            <CallListener />
            {user ? (
              userRole.includes('CREATOR') ? (
                <CreatorMainStack />
              ) : (
                <UserMainStack />
              )
            ) : null}
          </>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router;
