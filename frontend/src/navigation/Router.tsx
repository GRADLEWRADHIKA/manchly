import { Linking } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
// Remove AuthStack import if you are moving it inside UserMainStack
// import AuthStack from './AuthStack'; 
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UserMainStack from './UserMainStack';
import CreatorMainStack from './CreatorMainStack';
import { getAppLinkDataFromUrl } from 'react-native-chottulink-sdk';
import NotificationService from '../services/NotificationService';
import notifee, { EventType } from '@notifee/react-native';
import { store } from '../store/Store';
import { updateProfile, getCurrentUser } from '../store/UserSlice';
import { getUnreadCount, addRealtimeNotification } from '../store/NotificationSlice';
import { addSocketMessage } from '../store/ChatSlice';
import SocketService from '../services/SocketService';
import CallListener, { setNavigationRef } from '../components/CallListener';
import { navigationRef } from './navigationRef';

const PREFIXES = ['https://manchly.chottu.link', 'http://manchly.chottu.link', 'manchly://'];

// Rebuild a resolved URL so it uses our registered prefix
const ensurePrefix = (url: string): string => {
  const match = url.match(/\/(course|webinar)\/([^/?#]+)/);
  if (match) {
    return `https://manchly.chottu.link/${match[1]}/${match[2]}`;
  }
  return url;
};

// Resolve a ChottuLink short URL to the full destination URL
const resolveUrl = async (url: string | null): Promise<string | null> => {
  if (!url) return null;
  try {
    if (/\/(course|webinar)\/[^/?#]+/.test(url)) return ensurePrefix(url);

    if (
      url.includes('manchly.chottu.link') &&
      !url.includes('/course/') &&
      !url.includes('/webinar/')
    ) {
      const result = await getAppLinkDataFromUrl(url);
      if (result?.link) return ensurePrefix(result.link);
    }
    return url;
  } catch {
    return url;
  }
};

const extractDeepLinkParams = (
  url: string,
): { screen: 'CourseDetailsScreen' | 'WebinarDetails'; id: string } | null => {
  try {
    const courseMatch = url.match(/\/course\/([^/?#]+)/);
    if (courseMatch) {
      return { screen: 'CourseDetailsScreen', id: courseMatch[1] };
    }

    const webinarMatch = url.match(/\/webinar\/([^/?#]+)/);
    if (webinarMatch) {
      return { screen: 'WebinarDetails', id: webinarMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
};

// Resolve ChottuLink short URL to get the destination URL
const resolveChottuLink = async (
  url: string,
): Promise<{ screen: 'CourseDetailsScreen' | 'WebinarDetails'; id: string } | null> => {
  try {
    const directParams = extractDeepLinkParams(url);
    if (directParams) return directParams;

    const result = await getAppLinkDataFromUrl(url);
    if (result?.link) {
      return extractDeepLinkParams(result.link);
    }
    return null;
  } catch {
    return null;
  }
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
    return resolveUrl(url);
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      // Removed the isAuthenticated check here so guests can open deep links too
      const resolved = await resolveUrl(url);
      if (resolved) {
        listener(resolved);
      }
    });
    return () => subscription.remove();
  },
};

const navigateFromNotification = (data: any) => {
  if (!navigationRef.current?.isReady()) return;
  let parsed = data;
  if (typeof data?.payload === 'string') {
    try { parsed = JSON.parse(data.payload); } catch {}
  }
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
  const { token, user } = useSelector((state: any) => state.userReducer);
  const dispatch = useDispatch<any>();
  const userRole = String(user?.user_type || '').toUpperCase();
  
  const pendingDeepLink = useRef<{
    screen: 'CourseDetailsScreen' | 'WebinarDetails';
    id: string;
  } | null>(null);
  const pendingCallData = useRef<any>(null);
  const pendingNotificationData = useRef<any>(null);

  // Refresh user data on app open if token exists
  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser());
      dispatch(getUnreadCount());
    }
  }, [token]);

  // Socket listeners for real-time events (Only if authenticated)
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

    const handleNewMessage = (msg: any) => {
      dispatch(addSocketMessage(msg));
    };

    SocketService.on('new_notification', handleNewNotification);
    SocketService.on('user_status', handleUserStatus);
    SocketService.on('error', handleSocketError);
    SocketService.on('new_message', handleNewMessage);

    return () => {
      SocketService.off('new_notification', handleNewNotification);
      SocketService.off('user_status', handleUserStatus);
      SocketService.off('error', handleSocketError);
      SocketService.off('new_message', handleNewMessage);
    };
  }, [token]);

  // Setup FCM notifications (Only if authenticated)
  useEffect(() => {
    if (!token) return; // Don't setup push notifications for guests

    const setupNotifications = async () => {
      await NotificationService.requestPermission();
      await NotificationService.createChannel();
      const fcmToken = await NotificationService.getToken();
      if (fcmToken) {
        dispatch(updateProfile({ fcm_token: fcmToken }));
      }
    };

    setupNotifications();

    const unsubForeground = NotificationService.onForegroundMessage();
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

    NotificationService.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        if (NotificationService.isCallNotification(remoteMessage.data)) {
          pendingCallData.current = remoteMessage.data;
        } else {
          pendingNotificationData.current = remoteMessage.data;
        }
      }
    });

    const unsubTokenRefresh = NotificationService.onTokenRefresh((newToken) => {
      dispatch(updateProfile({ fcm_token: newToken }));
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

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={(ref) => {
          (navigationRef as any).current = ref;
          setNavigationRef(ref);
        }}
        linking={linking}>
        
        {/* Only mount CallListener if a token exists */}
        {token && <CallListener />}
        
        {/* Routing Logic: Creator Stack if logged in as creator, otherwise default to User Stack (Guests & standard users) */}
        {token && userRole.includes('CREATOR') ? (
          <CreatorMainStack />
        ) : (
          <UserMainStack />
        )}

      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router;