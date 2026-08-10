import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { X, Maximize2 } from 'lucide-react-native';
import { wp, hp } from '../utils/responsive';
import colors from '../utils/colors';

const INTRO_VIDEO_URL =
  'https://stream.mux.com/aiFSECiPT501KG02eutUYBTKc8aPPOz27ikxTnTHaKJJ00.m3u8';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloatingIntroVideoProps {
  visible: boolean;
  onClose: () => void;
  videoUrl?: string;
}

const FloatingIntroVideo: React.FC<FloatingIntroVideoProps> = ({
  visible,
  onClose,
  videoUrl = INTRO_VIDEO_URL,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!visible) return null;

  const handleClose = () => {
    setIsFullScreen(false);
    onClose();
  };

  return (
    <View
      style={
        isFullScreen
          ? styles.fullScreenVideoContainer
          : styles.floatingVideoContainer
      }
    >
      <View
        style={isFullScreen ? styles.expandedVideoWrap : styles.miniVideoWrap}
      >
        <View style={styles.videoButtonsRow}>
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={() => setIsFullScreen(prev => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Maximize2 size={wp(14)} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={wp(16)} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Video
          source={{ uri: videoUrl }}
          style={styles.floatingVideo}
          resizeMode={isFullScreen ? 'contain' : 'cover'}
          paused={false}
          controls={false}
          muted={false}
          playWhenInactive={false}
          playInBackground={false}
          ignoreSilentSwitch="obey"
          onEnd={handleClose}
        />
      </View>
    </View>
  );
};

export default FloatingIntroVideo;

const styles = StyleSheet.create({
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
