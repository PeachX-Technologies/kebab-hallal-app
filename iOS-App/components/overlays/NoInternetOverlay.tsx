import { Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAppState } from '../../context/AppStateContext';
import { useLocale } from '../../context/LocaleContext';
import Theme from '../../theme';

const WifiOffSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="${Theme.colors.textSecondary}">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.007v.008H12v-.008Z"/>
    </svg>`}
    width={32}
    height={32}
  />
);

export default function NoInternetOverlay() {
  const { isOnline } = useAppState();
  const { t } = useLocale();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth - 64, 400);

  if (isOnline) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay} accessibilityLiveRegion="assertive">
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.topAccent} />

          <View style={styles.body}>
            <View style={styles.iconBadge}>
              <WifiOffSvg />
            </View>

            <Text style={styles.title}>{t('overlays.noInternet.title')}</Text>
            <Text style={styles.message}>{t('overlays.noInternet.message')}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {}}
              accessibilityLabel={t('overlays.noInternet.retry')}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>{t('overlays.noInternet.retry')}</Text>
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
    width: '100%',
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
  retryButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
    ...Theme.shadows.flame,
  },
  retryText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
