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

export const navigationRef = createRef<NavigationContainerRef<any>>();

const PREFIXES = ['https://manchly.chottu.link', 'http://manchly.chottu.link'];

// Resolve a ChottuLink short URL to the full destination URL
const resolveUrl = async (url: string | null): Promise<string | null> => {
  if (!url) return null;
  try {
    // If URL already has /course/ path, return as-is
    if (/\/course\/[^/?#]+/.test(url)) return url;

    // Check if it's a chottulink short URL that needs resolving
    if (
      url.includes('manchly.chottu.link') &&
      !url.includes('/course/')
    ) {
      const result = await getAppLinkDataFromUrl(url);
      if (result?.link) return result.link;
    }
    return url;
  } catch {
    return url;
  }
};

const linking = {
  prefixes: PREFIXES,
  config: {
    screens: {
      CourseDetailsScreen: 'course/:courseId',
    },
  },
  // Resolve short URLs before React Navigation tries to match them
  async getInitialURL(): Promise<string | null> {
    const url = await Linking.getInitialURL();
    return resolveUrl(url);
  },
  subscribe(listener: (url: string) => void) {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      const resolved = await resolveUrl(url);
      if (resolved) {
        listener(resolved);
      }
    });
    return () => subscription.remove();
  },
};

// Extract courseId from a chottulink URL
const extractCourseId = (url: string): string | null => {
  try {
    const match = url.match(/\/course\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// Resolve ChottuLink short URL to get the destination URL
const resolveChottuLink = async (url: string): Promise<string | null> => {
  try {
    // If URL already has /course/ path, extract directly
    const directId = extractCourseId(url);
    if (directId) return directId;

    // Otherwise resolve the short link via SDK
    const result = await getAppLinkDataFromUrl(url);
    if (result?.link) {
      return extractCourseId(result.link);
    }
    return null;
  } catch {
    return null;
  }
};

const Router = () => {
  const { token } = useSelector((state: any) => state.userReducer);
  const { user } = useSelector((state: any) => state.userReducer);
  const pendingCourseId = useRef<string | null>(null);

  // Handle deep link when user is not authenticated — save it for after login
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      const courseId = await resolveChottuLink(url);
      if (courseId && !token) {
        pendingCourseId.current = courseId;
      }
    };

    // Only need to handle pre-auth deep links here.
    // Post-auth deep links are handled by the linking config's
    // custom getInitialURL and subscribe (which resolve short URLs).
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
    if (token && pendingCourseId.current) {
      const courseId = pendingCourseId.current;
      pendingCourseId.current = null;

      // Small delay to let navigation mount
      setTimeout(() => {
        navigationRef.current?.navigate('CourseDetailsScreen', { courseId });
      }, 500);
    }
  }, [token]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        {token ? (
          user?.user_type === 'USER' ? (
            <UserMainStack />
          ) : (
            <CreatorMainStack />
          )
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Router;
