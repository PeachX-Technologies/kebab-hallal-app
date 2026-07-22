import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import Theme from '../../theme';

interface EmptyStateProps {
  emoji?: string;
  message: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ArrowSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>`}
    width={16}
    height={16}
  />
);

export default function EmptyState({
  emoji = '📭',
  message,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.emojiWrap}>
        <View style={styles.emojiOuter}>
          <View style={[styles.emojiInner, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.secondary }]} />

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
          <ArrowSvg />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
  },

  emojiWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emojiInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  emoji: {
    fontSize: 40,
  },

  textBlock: {
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  message: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Theme.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xl,
    height: 52,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.full,
    ...Theme.shadows.flame,
  },
  buttonText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: '#fff',
  },
});
