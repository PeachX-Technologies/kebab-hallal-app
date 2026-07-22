import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useLocale } from '../context/LocaleContext';
import Theme from '../theme';

const ArrowLeftSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>`} width={22} height={22} />
);

const sectionKeys = ['general', 'orders', 'payments', 'delivery', 'cancellations', 'liability'];

export default function TermsScreen() {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <ArrowLeftSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionList}>
          {sectionKeys.map((key) => (
            <View key={key} style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>
                {t(`terms.sections.${key}.title`)}
              </Text>
              <Text style={styles.sectionBody}>
                {t(`terms.sections.${key}.content`)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>{t('terms.lastUpdated')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    borderBottomLeftRadius: Theme.borderRadii.xl,
    borderBottomRightRadius: Theme.borderRadii.xl,
    ...Theme.shadows.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.textInverse,
    letterSpacing: -0.3,
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  sectionList: {
    gap: Theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  sectionHeading: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.sm,
  },
  sectionBody: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.regular,
    fontFamily: Theme.fontFamily.regular,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textDisabled,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
});
