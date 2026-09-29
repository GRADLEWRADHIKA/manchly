import appsFlyer from 'react-native-appsflyer';

const APPSFLYER_DEV_KEY = 'czdDHp63aLS3GvmVC2e5em';
const ONELINK_TEMPLATE_ID = 'Ne3P';
const ONELINK_DOMAIN = 'manchly.onelink.me';

export const initAppsFlyer = () => {
  appsFlyer.setAppInviteOneLinkID(ONELINK_TEMPLATE_ID);

  appsFlyer.initSdk(
    {
      devKey: APPSFLYER_DEV_KEY,
      isDebug: __DEV__,
      onInstallConversionDataListener: true,
      onDeepLinkListener: true,
    },
    (result) => {
      console.log('AppsFlyer SDK initialized:', result);
    },
    (error) => {
      console.error('AppsFlyer SDK init error:', error);
    },
  );
};

interface GenerateLinkParams {
  type: 'course' | 'webinar'| 'session';
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export const generateShareLink = async (params: GenerateLinkParams): Promise<string> => {
  const deepLinkValue = `${params.type}/${params.id}`;
  const fallbackUrl = `https://${ONELINK_DOMAIN}/${params.type}/${params.id}`;

  try {
    const linkParams = {
      channel: 'in_app_share',
      campaign: `${params.type}_share`,
      userParams: {
        deep_link_value: deepLinkValue,
        deep_link_sub1: params.id,
        deep_link_sub2: params.type,
        af_dp: `manchly://${params.type}/${params.id}`,
        af_web_dp: fallbackUrl,
        af_og_title: params.title || params.type,
        af_og_description: params.description || `Check out this ${params.type}!`,
        af_og_image: params.imageUrl || '',
      },
    };

    const url = await new Promise<string>((resolve, reject) => {
      appsFlyer.generateInviteLink(
        linkParams,
        (link: string) => resolve(link),
        (error: string) => reject(error),
      );
    });

    return url;
  } catch {
    return fallbackUrl;
  }
};

export type DeepLinkDestination = {
  screen: 'CourseDetailsScreen' | 'WebinarDetails';
  id: string;
} | null;

export const parseDeepLinkValue = (deepLinkValue: string): DeepLinkDestination => {
  if (!deepLinkValue) return null;

  // deep_link_value format: "course/<id>" or "webinar/<id>"
  const courseMatch = deepLinkValue.match(/^course\/(.+)$/);
  if (courseMatch) {
    return { screen: 'CourseDetailsScreen', id: courseMatch[1] };
  }

  const webinarMatch = deepLinkValue.match(/^webinar\/(.+)$/);
  if (webinarMatch) {
    return { screen: 'WebinarDetails', id: webinarMatch[1] };
  }

  return null;
};

export const extractDeepLinkFromUrl = (url: string): DeepLinkDestination => {
  if (!url) return null;

  const courseMatch = url.match(/\/course\/([^/?#]+)/);
  if (courseMatch) {
    return { screen: 'CourseDetailsScreen', id: courseMatch[1] };
  }

  const webinarMatch = url.match(/\/webinar\/([^/?#]+)/);
  if (webinarMatch) {
    return { screen: 'WebinarDetails', id: webinarMatch[1] };
  }

  return null;
};

export default appsFlyer;
