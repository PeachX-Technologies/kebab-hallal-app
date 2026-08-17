import { StyleSheet, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import Theme from '../../theme';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export default function Card({ children, onPress, style, ...rest }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.lg,
    padding: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
});
