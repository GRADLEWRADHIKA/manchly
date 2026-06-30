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
import { getAppLinkDataFromUrl } from 'react-native-chottulink-sdk';
import NotificationService from '../services/NotificationService';
import notifee, { EventType } from '@notifee/react-native';
import { store } from '../store/Store';
import { updateProfile } from '../store/UserSlice';
import { getUnreadCount } from '../store/NotificationSlice';
import CallListener, { setNavigationRef } from '../components/CallListener';
import { useDispatch } from 'react-redux';
import { navigationRef } from './navigationRef';

const PREFIXES = ['https://manchly.chottu.link', 'http://manchly.chottu.link', 'manchly://'];

// Module-level flag so the static linking object can check auth state
let isAuthenticated = false;

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
    // Read token directly from store (PersistGate ensures rehydration before Router mounts)
    const token = store.getState().userReducer?.token;
    if (!token) return null;
    return resolveUrl(url);
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      // Only let React Navigation handle when authenticated
      if (!isAuthenticated) return;
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
  const pendingDeepLink = useRef<{
    screen: 'CourseDetailsScreen' | 'WebinarDetails';
    id: string;
  } | null>(null);
  const pendingCallData = useRef<any>(null);
  const pendingNotificationData = useRef<any>(null);

  // Keep module-level auth flag in sync
  useEffect(() => {
    isAuthenticated = !!token;
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
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      const destination = await resolveChottuLink(url);
      if (destination) {
        pendingDeepLink.current = destination;
      }
    };

    if (!token) {
      Linking.getInitialURL().then(handleDeepLink);

      const subscription = Linking.addEventListener('url', ({ url }) => {
        handleDeepLink(url);
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
