import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Theme from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...rest }: InputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        style={[styles.input, { borderColor: error ? colors.error : colors.border, color: colors.text, backgroundColor: colors.surface }, style]}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Theme.spacing.xs },
  label: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadii.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.fontSizes.md,
    minHeight: 52,
  },
  errorText: { fontSize: Theme.fontSizes.xs },
});
