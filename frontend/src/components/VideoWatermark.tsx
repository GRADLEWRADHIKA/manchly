import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { fp } from '../utils/responsive';

type Props = {
  /** Per-viewer identity text (e.g. "Name • 9402"). */
  text: string;
};

/**
 * Anti-piracy overlay (Feature #1). Renders the viewer's identity as a faint
 * label that slowly drifts to new positions over the player, so any screen
 * recording captures a traceable mark that can't be reliably cropped out.
 * Non-interactive (pointerEvents="none") so playback controls still work.
 */
const VideoWatermark: React.FC<Props> = ({ text }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (!size.w || !size.h) return;
    const LABEL_W = 180;
    const LABEL_H = 24;

    const moveTo = () => {
      const x = Math.random() * Math.max(0, size.w - LABEL_W);
      const y = Math.random() * Math.max(0, size.h - LABEL_H);
      Animated.timing(pos, {
        toValue: { x, y },
        duration: 1400,
        useNativeDriver: true,
      }).start();
    };

    moveTo();
    const id = setInterval(moveTo, 4000);
    return () => clearInterval(id);
  }, [size, pos]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={e =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }>
      <Animated.Text
        numberOfLines={1}
        style={[styles.mark, { transform: pos.getTranslateTransform() }]}>
        {text}
      </Animated.Text>
    </View>
  );
};

export default VideoWatermark;

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.28)',
    fontSize: fp(12),
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
