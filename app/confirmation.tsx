import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocaleContext';
import { useOrders } from '../context/OrderContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import Button from '../components/ui/Button';
import Theme from '../theme';

const WEBHOOK_TIMEOUT = 30000;

export default function ConfirmationScreen() {
  const { t } = useLocale();
  const { orders } = useOrders();
  const { orderId, paymentIntentId, totalAmount, deliveryMethod, paymentMethod } =
    useLocalSearchParams<{
      orderId?: string;
      paymentIntentId?: string;
      totalAmount?: string;
      deliveryMethod?: string;
      paymentMethod?: string;
    }>();

  const isCardPayment = !!paymentIntentId;
  const [isWaiting, setIsWaiting] = useState(isCardPayment);
  const [confirmedOrderId, setConfirmedOrderId] = useState(orderId || paymentIntentId || '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasValidOrderId = useRef(!!orderId);

  const isDelivery = deliveryMethod === 'delivery';

  useEffect(() => {
    const handler = () => true;
    BackHandler.addEventListener('hardwareBackPress', handler);
    return () => BackHandler.removeEventListener('hardwareBackPress', handler);
  }, []);

  // Animation values
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWaiting) return;

    Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isWaiting, circleScale, checkOpacity]);

  useEffect(() => {
    if (!isCardPayment) return;

    const checkOrders = () => {
      const matched = orders.find(
        (o) => o.stripePaymentIntentId === paymentIntentId,
      );
      if (matched) {
        setConfirmedOrderId(matched.id);
        hasValidOrderId.current = true;
        setIsWaiting(false);
        AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PAYMENT_INTENT_ID).catch(() => {});
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    };

    checkOrders();

    const interval = setInterval(checkOrders, 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(interval);
      setIsWaiting(false);
      setConfirmedOrderId(paymentIntentId || '');
      AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PAYMENT_INTENT_ID).catch(() => {});
    }, WEBHOOK_TIMEOUT);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isCardPayment, paymentIntentId, orders]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isWaiting ? (
          <View style={styles.content}>
            <View style={[styles.iconCircle, styles.iconCircleWaiting]}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
            <Text style={styles.title}>{t('confirmation.processingTitle')}</Text>
            <Text style={styles.subtitle}>{t('confirmation.processingSubtitle')}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.iconCircle,
                { transform: [{ scale: circleScale }] },
              ]}
            >
              <Animated.Text style={[styles.iconEmoji, { opacity: checkOpacity }]}>
                ✅
              </Animated.Text>
            </Animated.View>

            <Text style={styles.title}>{t('confirmation.title')}</Text>
            <Text style={styles.subtitle}>{t('confirmation.subtitle')}</Text>

            <View style={styles.referenceCard}>
              <Text style={styles.referenceLabel}>{t('confirmation.orderReference')}</Text>
              <Text style={styles.referenceValue}>{confirmedOrderId}</Text>
            </View>

            <View style={styles.etaCard}>
              <Text style={styles.etaIcon}>🕐</Text>
              <View style={styles.etaTextContainer}>
                <Text style={styles.etaLabel}>{t('confirmation.estimatedTime')}</Text>
                <Text style={styles.etaValue}>{t('confirmation.estimatedTimeValue')}</Text>
              </View>
            </View>

            <View style={styles.modeCard}>
              <Text style={styles.modeIcon}>
                {isDelivery ? '🛵' : '🛍️'}
              </Text>
              <Text style={styles.modeLabel}>
                {isDelivery ? t('orderMode.delivery') : t('orderMode.pickup')}
              </Text>
            </View>

            <Text style={styles.thankYou}>{t('confirmation.thankYou')}</Text>

            <View style={styles.buttonRow}>
              <Button
                title={t('confirmation.trackOrder')}
                onPress={() => {
                  if (!confirmedOrderId || !hasValidOrderId.current) {
                    router.replace('/(tabs)/orders');
                    return;
                  }
                  router.replace({
                    pathname: `/order/${confirmedOrderId}`,
                  });
                }}
                style={styles.trackButton}
                accessibilityLabel={t('confirmation.trackOrder')}
              />
            </View>

            <Button
              title={t('confirmation.backToHome')}
              variant="secondary"
              onPress={() => router.replace('/(tabs)')}
              style={styles.homeButton}
              accessibilityLabel={t('confirmation.backToHome')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    backgroundColor: Theme.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  iconCircleWaiting: {
    backgroundColor: Theme.colors.surfaceElevated,
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
  referenceCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: Theme.colors.success,
    gap: Theme.spacing.xs,
    ...Theme.shadows.sm,
  },
  referenceLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  referenceValue: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.success,
    letterSpacing: 2,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  etaIcon: { fontSize: 28 },
  etaTextContainer: { flex: 1 },
  etaLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  etaValue: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.lg,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modeIcon: { fontSize: 20 },
  modeLabel: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.text,
  },
  thankYou: {
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  buttonRow: {
    width: '100%',
    marginTop: Theme.spacing.sm,
  },
  trackButton: { width: '100%' },
  homeButton: { width: '100%' },
});
