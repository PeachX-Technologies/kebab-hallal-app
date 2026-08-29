import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Theme from '../../theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.topAccent, { backgroundColor: colors.primary }]} />

          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <View style={[styles.divider, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={onCancel}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{cancelLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: destructive ? colors.error : colors.primary }]}
                onPress={onConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                <Text style={[styles.confirmText, { color: colors.textInverse }]}>
                  {confirmLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },

  card: {
    borderRadius: Theme.borderRadii.xl,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.lg,
  },

  topAccent: {
    height: 6,
  },

  body: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.sm,
  },

  title: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginVertical: Theme.spacing.xs,
  },

  message: {
    fontSize: Theme.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Theme.spacing.sm,
  },

  actions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    width: '100%',
  },

  cancelButton: {
    flex: 1,
    borderRadius: Theme.borderRadii.full,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cancelText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },

  confirmButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.lg,
  },
  confirmText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
