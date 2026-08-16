import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Minimum supported screen width (320px) and maximum (430px).
 * All layouts use flex and percentage-based sizing to stay within this range.
 */
export const MIN_SCREEN_WIDTH = 320;
export const MAX_SCREEN_WIDTH = 430;

/**
 * Returns true if the current screen width is within the supported range.
 */
export function isScreenWidthSupported(): boolean {
  return SCREEN_WIDTH >= MIN_SCREEN_WIDTH && SCREEN_WIDTH <= MAX_SCREEN_WIDTH;
}

/**
 * Minimum touch target size per accessibility guidelines (44×44 points).
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Minimum font sizes per spec:
 * - Body text: 14sp
 * - Headings: 18sp
 */
export const MIN_BODY_FONT_SIZE = 14;
export const MIN_HEADING_FONT_SIZE = 18;
