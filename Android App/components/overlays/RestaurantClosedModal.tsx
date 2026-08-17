import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAppState } from '../../context/AppStateContext';
import { useLocale } from '../../context/LocaleContext';
import Theme from '../../theme';

const LockSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="${Theme.colors.textSecondary}">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
    </svg>`}
    width={28}
    height={28}
  />
);

const XSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`}
    width={16}
    height={16}
  />
);

export default function RestaurantClosedModal() {
  const { restaurantOpen } = useAppState();
  const { t } = useLocale();
  const { width: screenWidth } = useWindowDimensions();
  const [dismissed, setDismissed] = useState(false);
  const cardWidth = Math.min(screenWidth - 64, 400);

  useEffect(() => {
    if (restaurantOpen) setDismissed(false);
  }, [restaurantOpen]);

  return (
    <Modal
      visible={!restaurantOpen && !dismissed}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.topAccent} />

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.iconBadge}>
              <LockSvg />
            </View>

            <Text style={styles.title}>{t('overlays.restaurantClosed.title')}</Text>
            <Text style={styles.message}>{t('overlays.restaurantClosed.message')}</Text>

            <View style={styles.scheduleCard}>
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>{t('overlays.restaurantClosed.lunch')}</Text>
                <View style={styles.scheduleDot} />
                <Text style={styles.scheduleTime}>11:00 – 15:00</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleRow}>
                <Text style={styles.scheduleLabel}>{t('overlays.restaurantClosed.dinner')}</Text>
                <View style={styles.scheduleDot} />
                <Text style={styles.scheduleTime}>17:00 – 02:00</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.dismissButton} onPress={() => setDismissed(true)} activeOpacity={0.88}>
              <XSvg />
              <Text style={styles.dismissText}>{t('overlays.restaurantClosed.close') || 'Close'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    ...Theme.shadows.lg,
    maxHeight: '80%',
  },
  topAccent: {
    height: 6,
    backgroundColor: Theme.colors.primary,
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.sm,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scheduleCard: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadii.lg,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    gap: 0,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  scheduleLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    width: 56,
  },
  scheduleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
  },
  scheduleTime: {
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.text,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 2,
  },
  dismissButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
    ...Theme.shadows.flame,
  },
  dismissText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
