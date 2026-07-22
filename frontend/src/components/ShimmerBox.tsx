import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// Dark navy shimmer tuned for the user (uBg/uCard) theme
export const SHIMMER_COLORS = ['#1A1E38', '#2A3057', '#1A1E38'];

type Props = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Reusable shimmer skeleton block. Pass width/height/radius for quick sizing
 * or a full style object for custom placeholders.
 */
const ShimmerBox = ({ width, height, radius = 8, style }: Props) => (
  <ShimmerPlaceholder
    shimmerColors={SHIMMER_COLORS}
    style={[{ width, height, borderRadius: radius }, style]}
  />
);

export default ShimmerBox;
