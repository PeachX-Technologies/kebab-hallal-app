import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import Theme from '../../theme';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, visible, onHide, duration = 2500 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible, duration, opacity, onHide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} accessibilityLiveRegion="polite">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    left: Theme.spacing.xl,
    right: Theme.spacing.xl,
    backgroundColor: 'rgba(26,26,26,0.9)',
    borderRadius: Theme.borderRadii.lg,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    textAlign: 'center',
  },
});
