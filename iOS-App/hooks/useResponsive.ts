import { useWindowDimensions, ScaledSize } from 'react-native';
import { getResponsiveValues } from '../utils/responsive';

export function useResponsive() {
  const dimensions = useWindowDimensions();
  return getResponsiveValues(dimensions);
}

export type ResponsiveValues = ReturnType<typeof getResponsiveValues>;
