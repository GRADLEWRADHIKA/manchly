import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import Orientation from 'react-native-orientation-locker';
import { wp, hp, fp } from '../utils/responsive';
import colors from '../utils/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTROLS_TIMEOUT = 4000;
const SEEK_SECONDS = 10;

interface YouTubePlayerProps {
  source: { uri: string };
  title?: string;
  onClose?: () => void;
  autoPlay?: boolean;
  isFullscreenDefault?: boolean;
  style?: any;
  showCloseButton?: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  source,
  title = '',
  onClose,
  autoPlay = true,
  isFullscreenDefault = false,
  style,
  showCloseButton = true,
}) => {
  const videoRef = useRef<any>(null);
  const controlsTimeout = useRef<any>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const doubleTapRef = useRef<{ side: string; timer: any }>({ side: '', timer: null });
  const seekAnimLeft = useRef(new Animated.Value(0)).current;
  const seekAnimRight = useRef(new Animated.Value(0)).current;

  const [paused, setPaused] = useState(!autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenDefault);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekText, setSeekText] = useState('');
  const [seekSide, setSeekSide] = useState<'left' | 'right' | null>(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  const progress = duration > 0 ? currentTime / duration : 0;

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (!paused) {
      controlsTimeout.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setControlsVisible(false));
      }, CONTROLS_TIMEOUT);
    }
  }, [paused, controlsOpacity]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    resetControlsTimer();
  }, [controlsOpacity, resetControlsTimer]);

  useEffect(() => {
    if (controlsVisible && !paused) {
      resetControlsTimer();
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [paused, controlsVisible, resetControlsTimer]);

  // Video event handlers
  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setIsBuffering(false);
  };

  const onProgress = (data: OnProgressData) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  };

  const onBuffer = ({ isBuffering: buffering }: { isBuffering: boolean }) => {
    setIsBuffering(buffering);
  };

  const onEnd = () => {
    setPaused(true);
    setCurrentTime(duration);
    showControls();
  };

  const onError = (error: any) => {
    // Video error handled silently
  };

  // Control actions
  const togglePlayPause = () => {
    if (currentTime >= duration && duration > 0) {
      videoRef.current?.seek(0);
      setCurrentTime(0);
      setPaused(false);
    } else {
      setPaused(!paused);
    }
    showControls();
  };

  const seekForward = () => {
    const newTime = Math.min(currentTime + SEEK_SECONDS, duration);
    videoRef.current?.seek(newTime);
    setCurrentTime(newTime);
    triggerSeekAnimation('right');
  };

  const seekBackward = () => {
    const newTime = Math.max(currentTime - SEEK_SECONDS, 0);
    videoRef.current?.seek(newTime);
    setCurrentTime(newTime);
    triggerSeekAnimation('left');
  };

  const triggerSeekAnimation = (side: 'left' | 'right') => {
    setSeekSide(side);
    setSeekText(`${SEEK_SECONDS}s`);
    const anim = side === 'left' ? seekAnimLeft : seekAnimRight;
    anim.setValue(1);
    Animated.timing(anim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => setSeekSide(null));
  };

  // Double tap to seek
  const handleDoubleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      seekBackward();
    } else {
      seekForward();
    }
    showControls();
  };

  const handleTapArea = (side: 'left' | 'right') => {
    if (doubleTapRef.current.timer && doubleTapRef.current.side === side) {
      clearTimeout(doubleTapRef.current.timer);
      doubleTapRef.current.timer = null;
      handleDoubleTap(side);
    } else {
      if (doubleTapRef.current.timer) {
        clearTimeout(doubleTapRef.current.timer);
      }
      doubleTapRef.current.side = side;
      doubleTapRef.current.timer = setTimeout(() => {
        doubleTapRef.current.timer = null;
        if (controlsVisible) {
          Animated.timing(controlsOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setControlsVisible(false));
        } else {
          showControls();
        }
      }, 250);
    }
  };

  // Seek bar tap
  const handleSeekBarPress = (evt: any) => {
    if (sliderWidth <= 0 || duration <= 0) return;
    const x = evt.nativeEvent.locationX;
    const seekTo = (x / sliderWidth) * duration;
    videoRef.current?.seek(seekTo);
    setCurrentTime(seekTo);
    showControls();
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      Orientation.lockToPortrait();
    } else {
      Orientation.lockToLandscape();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    showControls();
  };

  const renderPlayerContent = () => (
    <>
      {/* Video */}
      <Video
        ref={videoRef}
        source={source}
        style={styles.video}
        resizeMode="contain"
        paused={paused}
        muted={isMuted}
        onLoad={onLoad}
        onProgress={onProgress}
        onBuffer={onBuffer}
        onEnd={onEnd}
        onError={onError}
        playWhenInactive={false}
        playInBackground={false}
        ignoreSilentSwitch="obey"
        progressUpdateInterval={250}
      />

      {/* Double-tap areas */}
      <View style={styles.tapAreasContainer}>
        <TouchableWithoutFeedback onPress={() => handleTapArea('left')}>
          <View style={styles.tapAreaLeft}>
            {seekSide === 'left' && (
              <Animated.View style={[styles.seekIndicator, { opacity: seekAnimLeft }]}>
                <SkipBack size={wp(24)} color={colors.white} />
                <Text style={styles.seekText}>{seekText}</Text>
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => handleTapArea('right')}>
          <View style={styles.tapAreaRight}>
            {seekSide === 'right' && (
              <Animated.View style={[styles.seekIndicator, { opacity: seekAnimRight }]}>
                <SkipForward size={wp(24)} color={colors.white} />
                <Text style={styles.seekText}>{seekText}</Text>
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Buffering indicator */}
      {isBuffering && (
        <View style={styles.bufferingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}

      {/* Controls overlay */}
      {controlsVisible && (
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {showCloseButton && onClose && !isFullscreen && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.topButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={wp(24)} color={colors.white} />
                </TouchableOpacity>
              )}
              {title ? (
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
            </View>
            <View style={styles.topBarRight}>
              <TouchableOpacity
                onPress={toggleMute}
                style={styles.topButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {isMuted ? (
                  <VolumeX size={wp(22)} color={colors.white} />
                ) : (
                  <Volume2 size={wp(22)} color={colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Center play/pause & seek buttons */}
          <View style={styles.centerControls}>
            <TouchableOpacity
              onPress={seekBackward}
              style={styles.seekButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SkipBack size={wp(28)} color={colors.white} fill={colors.white} />
              <Text style={styles.seekLabel}>10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.playPauseButton}
            >
              {paused ? (
                <Play size={wp(36)} color={colors.white} fill={colors.white} />
              ) : (
                <Pause size={wp(36)} color={colors.white} fill={colors.white} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={seekForward}
              style={styles.seekButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SkipForward size={wp(28)} color={colors.white} fill={colors.white} />
              <Text style={styles.seekLabel}>10</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom bar with progress */}
          <View style={styles.bottomBar}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

            <TouchableOpacity
              style={styles.progressBarContainer}
              activeOpacity={1}
              onPress={handleSeekBarPress}
              onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            >
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    { left: `${progress * 100}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.timeText}>{formatTime(duration)}</Text>

            <TouchableOpacity
              onPress={toggleFullscreen}
              style={styles.fullscreenButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isFullscreen ? (
                <Minimize size={wp(20)} color={colors.white} />
              ) : (
                <Maximize size={wp(20)} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </>
  );

  return (
    <>
      {!isFullscreen && (
        <View style={[styles.container, style]}>
          {renderPlayerContent()}
        </View>
      )}

      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['landscape-left', 'landscape-right']}
        statusBarTranslucent
        onRequestClose={toggleFullscreen}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenContainer}>
          {renderPlayerContent()}
        </View>
      </Modal>
    </>
  );
};

export default YouTubePlayer;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.black,
    borderRadius: wp(12),
    overflow: 'hidden',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.black,
    zIndex: 999,
    elevation: 999,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  tapAreasContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  tapAreaLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapAreaRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: wp(40),
    width: wp(80),
    height: wp(80),
    justifyContent: 'center',
  },
  seekText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '700',
    marginTop: hp(2),
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingTop: Platform.OS === 'ios' ? hp(8) : hp(8),
    paddingBottom: hp(6),
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topButton: {
    padding: wp(6),
  },
  titleText: {
    color: colors.white,
    fontSize: fp(14),
    fontWeight: '600',
    marginLeft: wp(8),
    flex: 1,
  },
  // Center controls
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(40),
  },
  playPauseButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: wp(64),
    height: wp(64),
    borderRadius: wp(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekLabel: {
    color: colors.white,
    fontSize: fp(10),
    fontWeight: '700',
    marginTop: hp(1),
  },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(12),
    paddingBottom: hp(10),
    paddingTop: hp(6),
  },
  timeText: {
    color: colors.white,
    fontSize: fp(12),
    fontWeight: '500',
    minWidth: wp(40),
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: hp(24),
    justifyContent: 'center',
    marginHorizontal: wp(6),
  },
  progressBarBg: {
    height: hp(3),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: hp(2),
    overflow: 'visible',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: hp(2),
  },
  progressThumb: {
    position: 'absolute',
    top: -hp(5),
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: '#FF0000',
    marginLeft: -wp(7),
  },
  fullscreenButton: {
    paddingLeft: wp(8),
  },
});
