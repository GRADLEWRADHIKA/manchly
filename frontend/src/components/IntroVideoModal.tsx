import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import { X } from 'lucide-react-native';
import { wp, hp } from '../utils/responsive';
import colors from '../utils/colors';

const INTRO_VIDEO_URL =
  'https://stream.mux.com/aiFSECiPT501KG02eutUYBTKc8aPPOz27ikxTnTHaKJJ00.m3u8';

interface IntroVideoModalProps {
  visible: boolean;
  onClose: () => void;
}

const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={wp(24)} color={colors.white} />
          </TouchableOpacity>

          <Video
            source={{ uri: INTRO_VIDEO_URL }}
            style={styles.video}
            resizeMode="contain"
            paused={false}
            controls={false}
            muted={false}
            playWhenInactive={false}
            playInBackground={false}
            ignoreSilentSwitch="obey"
            onEnd={onClose}
          />
        </View>
      </View>
    </Modal>
  );
};

export default IntroVideoModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    aspectRatio: 9 / 16,
    maxHeight: '85%',
    borderRadius: wp(12),
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  closeButton: {
    position: 'absolute',
    top: hp(10),
    right: wp(10),
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: wp(20),
    padding: wp(6),
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
