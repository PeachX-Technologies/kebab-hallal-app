import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAppState } from '../../context/AppStateContext';
import { useLocale } from '../../context/LocaleContext';
import Theme from '../../theme';

const TruckSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="${Theme.colors.textSecondary}">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
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

export default function DeliveryUnavailableModal() {
  const { deliveryAvailable, orderMode } = useAppState();
  const { t } = useLocale();
  const { width: screenWidth } = useWindowDimensions();
  const [dismissed, setDismissed] = useState(false);
  const cardWidth = Math.min(screenWidth - 64, 400);

  useEffect(() => {
    setDismissed(false);
  }, [orderMode]);

  return (
    <Modal
      visible={!deliveryAvailable && orderMode === 'delivery' && !dismissed}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.topAccent} />

          <View style={styles.body}>
            <View style={styles.iconBadge}>
              <TruckSvg />
            </View>

            <Text style={styles.title}>{t('overlays.deliveryUnavailable.title')}</Text>
            <Text style={styles.message}>{t('overlays.deliveryUnavailable.message')}</Text>

            <TouchableOpacity style={styles.dismissButton} onPress={() => setDismissed(true)} activeOpacity={0.88}>
              <XSvg />
              <Text style={styles.dismissText}>{t('overlays.deliveryUnavailable.close') || 'Close'}</Text>
            </TouchableOpacity>
          </View>
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
  },
  topAccent: {
    height: 6,
    backgroundColor: Theme.colors.primary,
  },
  body: {
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
    marginTop: Theme.spacing.sm,
    ...Theme.shadows.flame,
  },
  dismissText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
