import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Theme from '../../theme';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

export default function Loader({ fullScreen = false, size = 'large' }: LoaderProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={Theme.colors.primary} accessibilityLabel="Loading" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 999,
  },
});
