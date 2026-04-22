import { Linking } from 'react-native';
import React, { useEffect, useRef, createRef } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import AuthStack from './AuthStack';
import { useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UserMainStack from './UserMainStack';
import CreatorMainStack from './CreatorMainStack';
import { getAppLinkDataFromUrl } from 'react-native-chottulink-sdk';
import NotificationService from '../services/NotificationService';
import { store } from '../store/Store';

export const navigationRef = createRef<NavigationContainerRef<any>>();

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

const Router = () => {
  const { token } = useSelector((state: any) => state.userReducer);
  const { user } = useSelector((state: any) => state.userReducer);
  const pendingDeepLink = useRef<{
    screen: 'CourseDetailsScreen' | 'WebinarDetails';
    id: string;
  } | null>(null);

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
      // TODO: Send fcmToken to your backend to associate with user
    };

    setupNotifications();

    // Foreground notification — displayed via notifee
    const unsubForeground = NotificationService.onForegroundMessage();

    // Background notification tap handler
    const unsubOpened = NotificationService.onNotificationOpenedApp(
      (remoteMessage) => {
        // TODO: Navigate based on remoteMessage.data
      },
    );

    // Check if app was opened from a killed state notification
    NotificationService.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        // TODO: Navigate based on remoteMessage.data
      }
    });

    // Token refresh listener
    const unsubTokenRefresh = NotificationService.onTokenRefresh((newToken) => {
      // TODO: Send new token to backend
    });

    return () => {
      unsubForeground();
      unsubOpened();
      unsubTokenRefresh();
    };
  }, []);

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
      <NavigationContainer ref={navigationRef} linking={linking}>
        {token ? (
          user ? (
            user.user_type.includes('USER') ? (
              <UserMainStack />
            ) : (
              <CreatorMainStack />
            )
          ) : null
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router;
