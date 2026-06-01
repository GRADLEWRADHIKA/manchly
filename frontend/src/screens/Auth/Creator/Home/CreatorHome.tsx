import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Dimensions,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KycWarningModal from './KycWarningModal';
import { Bell, Instagram } from 'lucide-react-native';
import colors from '../../../../utils/colors';
import { wp, hp, fp } from '../../../../utils/responsive';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { X, Play, Maximize2 } from 'lucide-react-native';
import { clearJustLoggedIn } from '../../../../store/UserSlice';
import GoLiveCard from './GoLiveCard';
import SessionCard from './SessionCard';
import LaunchCourseCard from './LaunchCourseCard';
import RevenueCard from './RevenueCard';

const INTRO_VIDEO_URL =
  'https://stream.mux.com/aiFSECiPT501KG02eutUYBTKc8aPPOz27ikxTnTHaKJJ00.m3u8';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CreatorHome = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.userReducer);
  const insets = useSafeAreaInsets();
  const { justLoggedIn } = useSelector((state: any) => state.userReducer);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const kycDismissed = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (justLoggedIn) {
      setShowIntroVideo(true);
      dispatch(clearJustLoggedIn());
    }
  }, [justLoggedIn]);

  // Show KYC modal after page renders properly
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!user?.kyc_verified && !kycDismissed.current) {
      timer = setTimeout(() => {
        setShowKycModal(true);
      }, 1000);
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !user?.kyc_verified &&
        !kycDismissed.current
      ) {
        setShowKycModal(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [user?.kyc_verified]);

  const displayName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Creator';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'C';

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.greetingSub}>{getGreeting()}</Text>
              <Text style={styles.greeting}>{displayName?.split(' ')[0]}</Text>
            </View>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: wp(4) }}
          >
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setShowIntroVideo(true)}
            >
              <Play size={wp(18)} color={colors.white} fill={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() =>
                Linking.openURL('https://www.instagram.com/manchly_app')
              }
            >
              <Instagram size={wp(20)} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('CreatorNotification')}
            >
              <Bell size={wp(20)} color={colors.white} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <RevenueCard />

        <LaunchCourseCard />

        <GoLiveCard />

        <SessionCard />
      </ScrollView>

      <KycWarningModal
        visible={showKycModal}
        onDismiss={() => {
          kycDismissed.current = true;
          setShowKycModal(false);
        }}
      />

      {showIntroVideo ? (
        <View
          style={
            isFullScreen
              ? styles.fullScreenVideoContainer
              : styles.floatingVideoContainer
          }
        >
          <View
            style={
              isFullScreen ? styles.expandedVideoWrap : styles.miniVideoWrap
            }
          >
            <View style={styles.videoButtonsRow}>
              <TouchableOpacity
                style={styles.videoActionButton}
                onPress={() => setIsFullScreen(!isFullScreen)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Maximize2 size={wp(14)} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.videoActionButton}
                onPress={() => {
                  setShowIntroVideo(false);
                  setIsFullScreen(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={wp(16)} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Video
              source={{ uri: INTRO_VIDEO_URL }}
              style={styles.floatingVideo}
              resizeMode={isFullScreen ? 'contain' : 'cover'}
              paused={false}
              controls={false}
              muted={false}
              playWhenInactive={false}
              playInBackground={false}
              ignoreSilentSwitch="obey"
              onEnd={() => {
                setShowIntroVideo(false);
                setIsFullScreen(false);
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default CreatorHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  headerWrapper: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(14),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(12),
  },
  avatar: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.white,
  },
  greetingSub: {
    fontSize: fp(13),
    color: colors.muted,
    fontWeight: '500',
  },
  greeting: {
    fontSize: fp(18),
    fontWeight: '800',
    color: colors.white,
    marginTop: hp(1),
  },
  bellBtn: {
    width: wp(44),
    height: wp(44),
    borderRadius: wp(22),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bellDot: {
    position: 'absolute',
    top: wp(10),
    right: wp(12),
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: colors.error,
  },

  scrollContent: {
    paddingBottom: hp(30),
  },
  sectionPadding: {
    paddingHorizontal: wp(16),
    marginTop: hp(14),
  },


  // Floating Intro Video
  floatingVideoContainer: {
    position: 'absolute',
    bottom: hp(16),
    right: wp(12),
    width: SCREEN_WIDTH * 0.35,
    aspectRatio: 9 / 16,
    borderRadius: wp(12),
    overflow: 'hidden',
    backgroundColor: colors.black,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fullScreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
  },
  expandedVideoWrap: {
    width: SCREEN_WIDTH * 0.75,
    aspectRatio: 9 / 16,
    borderRadius: wp(16),
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  miniVideoWrap: {
    width: '100%',
    height: '100%',
  },
  videoButtonsRow: {
    position: 'absolute',
    top: wp(8),
    right: wp(8),
    zIndex: 10,
    flexDirection: 'row',
    gap: wp(8),
  },
  videoActionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(14),
    padding: wp(6),
  },
  floatingVideo: {
    width: '100%',
    height: '100%',
  },
});
