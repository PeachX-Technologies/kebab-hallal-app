import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Theme from '../../theme';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
}

export default function Button({ title, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5 },
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      <Text style={[styles.text, isPrimary ? { color: colors.textInverse } : { color: colors.primary }, disabled && { color: colors.textDisabled }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadii.lg,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: Theme.fontSizes.lg, fontWeight: Theme.fontWeights.bold, fontFamily: Theme.fontFamily.bold },
});
