import { useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import Button from '../components/ui/Button';
import Theme from '../theme';
import { RESTAURANT_PHONE, RESTAURANT_PHONE_RAW } from '../constants';

export default function FailureScreen() {
  const { t } = useLocale();
  const { errorMessage } = useLocalSearchParams<{ errorMessage?: string }>();

  const handleRetry = useCallback(() => {
    router.back();
  }, []);

  const handleCall = useCallback(() => {
    Linking.openURL(`tel:${RESTAURANT_PHONE_RAW}`);
  }, []);

  const handleWhatsApp = useCallback(() => {
    Linking.openURL(`https://wa.me/${RESTAURANT_PHONE_RAW}`);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>❌</Text>
        </View>

        <Text style={styles.title}>{t('failure.title')}</Text>
        <Text style={styles.subtitle}>{t('failure.subtitle')}</Text>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={t('failure.tryAgain')}
            onPress={handleRetry}
            style={styles.primaryButton}
            accessibilityLabel={t('failure.tryAgain')}
          />

          <Text style={styles.orLabel}>{t('failure.or')}</Text>

          <Text style={styles.contactTitle}>{t('failure.contactUs')}</Text>

          <View style={styles.contactRow}>
            <View style={styles.contactButtonWrapper}>
              <Button
                title={t('failure.call')}
                variant="secondary"
                onPress={handleCall}
                accessibilityLabel={t('failure.call')}
              />
            </View>
            <View style={styles.contactButtonWrapper}>
              <Button
                title={t('failure.whatsapp')}
                variant="secondary"
                onPress={handleWhatsApp}
                accessibilityLabel={t('failure.whatsapp')}
              />
            </View>
          </View>

          <Text style={styles.phoneLabel}>{RESTAURANT_PHONE}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  iconEmoji: { fontSize: 60 },
  title: {
    fontSize: Theme.fontSizes.xxl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: Theme.colors.errorLight,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.error,
  },
  errorText: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.error,
    textAlign: 'center',
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  actions: {
    width: '100%',
    gap: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  primaryButton: { width: '100%' },
  orLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
  },
  contactTitle: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    width: '100%',
  },
  contactButtonWrapper: { flex: 1 },
  phoneLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fontFamily.medium,
  },
});
