import {
  widthPercentageToDP,
  heightPercentageToDP,
} from 'react-native-responsive-screen';

// Base design dimensions (iPhone X)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Width-based responsive scaling.
 * Use for: horizontal padding, margins, widths, border-radius, icon sizes.
 */
export const wp = (px: number): number =>
  widthPercentageToDP((px / BASE_WIDTH) * 100);

/**
 * Height-based responsive scaling.
 * Use for: vertical padding, margins, heights.
 */
export const hp = (px: number): number =>
  heightPercentageToDP((px / BASE_HEIGHT) * 100);

/**
 * Font-size responsive scaling (width-based for consistency across devices).
 */
export const fp = (px: number): number =>
  widthPercentageToDP((px / BASE_WIDTH) * 100);
