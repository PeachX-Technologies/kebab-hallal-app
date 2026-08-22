import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../context/CartContext';
import { useAppState } from '../context/AppStateContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { formatPrice } from '../utils/priceUtils';
import { PAYMENT_INTENT_URL } from '../utils/stripe';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { countUserDeliveryOrders, getAndIncrementCounter } from '../services/orderService';
import Theme from '../theme';

type PaymentMethod = 'cash' | 'card';

interface ProductItem {
  itemName: string;
  itemImage: string;
  basePrice: number;
  baseDeliveryPrice: number;
  totalPrice: number;
  totalDeliveryPrice: number;
  adPrice: number;
  selectedOptions: Record<string, any>;
  quantity: number;
  id: string;
}

export default function PaymentScreen() {
  const { t } = useLocale();
  const { items, subtotal, clearCart } = useCart();
  const { orderMode } = useAppState();
  const { orders, addOrder } = useOrders();
  const { firebaseUser, user } = useAuth();
  const stripe = useStripe();
  const {
    deliveryAddress,
    deliveryNotes,
    totalAmount: totalAmountParam,
    subtotal: subtotalParam,
    deliveryFee,
    products,
    zoneName,
    zoneId,
    address: checkoutAddress,
    houseNumber: checkoutHouseNumber,
    city: checkoutCity,
    locationLat,
    locationLng,
    name: checkoutName,
    phone: checkoutPhone,
    scheduledAt: scheduledAtParam,
  } = useLocalSearchParams<{
    deliveryAddress?: string;
    deliveryNotes?: string;
    totalAmount?: string;
    subtotal?: string;
    deliveryFee?: string;
    products?: string;
    zoneName?: string;
    zoneId?: string;
    address?: string;
    houseNumber?: string;
    city?: string;
    locationLat?: string;
    locationLng?: string;
    name?: string;
    phone?: string;
    scheduledAt?: string;
  }>();
  const insets = useSafeAreaInsets();

  const totalAmount = parseFloat(totalAmountParam || String(subtotal));
  const [canPayCash, setCanPayCash] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (firebaseUser) {
      countUserDeliveryOrders(firebaseUser.uid).then((count) => {
        setCanPayCash(count > 0);
        if (count === 0) {
          setSelectedMethod('card');
        }
      });
    }
  }, [firebaseUser]);

  const handleCashPayment = useCallback(async () => {
    setIsProcessing(true);
    try {
      const clientName = user?.name || checkoutName || '';
      const clientPhone = user?.phone || checkoutPhone || '';
      const isDelivery = orderMode === 'delivery';

      const order = await addOrder({
        orderMode,
        items,
        subtotal,
        totalAmount,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 0,
        deliveryAddress: isDelivery ? {
          street: checkoutAddress || deliveryAddress || '',
          house: checkoutHouseNumber || '',
          city: checkoutCity || 'Catania',
        } : undefined,
        ...(deliveryNotes ? { deliveryNotes } : {}),
        ...(locationLat ? { deliveryLat: parseFloat(locationLat) } : {}),
        ...(locationLng ? { deliveryLng: parseFloat(locationLng) } : {}),
        paymentMethod: 'cash',
        clientName,
        clientPhone,
        ...(scheduledAtParam ? { scheduledAt: scheduledAtParam } : {}),
      });
      clearCart();
      setIsProcessing(false);
      router.replace({
        pathname: '/confirmation',
        params: {
          orderId: order.id,
          deliveryMethod: orderMode,
          ...(scheduledAtParam ? { scheduledAt: scheduledAtParam } : {}),
        },
      });
    } catch (err: any) {
      console.error('Cash payment error:', err);
      Alert.alert(t('payment.error'), err.message || t('payment.errorGeneric'));
      setIsProcessing(false);
    }
  }, [addOrder, clearCart, deliveryAddress, deliveryNotes, items, orderMode, subtotal, totalAmount, deliveryFee, t, user, checkoutName, checkoutPhone, checkoutAddress, checkoutHouseNumber, checkoutCity, locationLat, locationLng]);

  const handleCardPayment = useCallback(async () => {
    if (!firebaseUser) {
      Alert.alert(t('payment.error'), t('payment.loginRequired'));
      return;
    }

    setIsProcessing(true);

    try {
      let parsedProducts: ProductItem[] = [];
      try {
        parsedProducts = products ? JSON.parse(products) : [];
      } catch {
        parsedProducts = items.map((item) => ({
          id: item.itemId,
          itemId: item.itemId,
          itemName: item.itemName,
          itemImage: item.itemImage || item.image || '',
          basePrice: orderMode === 'delivery' ? 0 : item.basePrice,
          baseDeliveryPrice: item.baseDeliveryPrice || 0,
          totalPrice: item.totalPrice,
          totalDeliveryPrice: item.totalDeliveryPrice ?? item.totalPrice,
          adPrice: item.adPrice || 0,
          selectedOptions: item.selectedOptions,
          quantity: item.quantity,
        }));
      }

      if (parsedProducts.length === 0) {
        Alert.alert(t('payment.error'), t('payment.emptyCart'));
        setIsProcessing(false);
        return;
      }

      const totalAmountNum = parseFloat(String(totalAmount || 0));
      if (isNaN(totalAmountNum) || totalAmountNum <= 0) {
        Alert.alert(t('payment.error'), t('payment.invalidAmount'));
        setIsProcessing(false);
        return;
      }

      const realCounter = await getAndIncrementCounter();
      const body = {
        product: parsedProducts,
        id: firebaseUser.uid,
        userName: user?.name || checkoutName || '',
        userPhone: user?.phone || checkoutPhone || '',
        deliveryMethod: orderMode,
        orderSource: 'mobile-app',
        ...(orderMode === 'delivery'
          ? {
              zoneCost: parseFloat(deliveryFee || '0'),
              deliveryAddress: {
                house: checkoutHouseNumber || '',
                street: checkoutAddress || deliveryAddress || '',
                city: checkoutCity || 'Catania',
                lon: locationLng ? parseFloat(locationLng) : 0,
                lat: locationLat ? parseFloat(locationLat) : 0,
              },
            }
          : {}),
        additionalInfo: deliveryNotes || '',
        ...(scheduledAtParam ? { scheduledAt: scheduledAtParam } : {}),
        counter: realCounter,
      };

      const response = await fetch(PAYMENT_INTENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to create payment');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      const { error } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Kebab Hallal Catania',
        merchantCountryCode: 'IT',
        style: 'automatic',
        applePay: {
          merchantCountryCode: 'IT',
        },
        googlePay: {
          merchantCountryCode: 'IT',
          currencyCode: 'eur',
          testEnv: false,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          setIsProcessing(false);
          return;
        }
        throw new Error(presentError.message);
      }

      clearCart();
      setIsProcessing(false);

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PAYMENT_INTENT_ID, paymentIntentId);

      router.replace({
        pathname: '/confirmation',
        params: {
          paymentIntentId,
          totalAmount: String(totalAmount),
          deliveryMethod: orderMode,
          paymentMethod: 'Stripe',
          ...(scheduledAtParam ? { scheduledAt: scheduledAtParam } : {}),
        },
      });
    } catch (err: any) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      router.replace({
        pathname: '/failure',
        params: { errorMessage: err.message || t('payment.errorGeneric') },
      });
    }
  }, [
    firebaseUser,
    user,
    items,
    orderMode,
    zoneName,
    deliveryFee,
    deliveryAddress,
    deliveryNotes,
    products,
    totalAmount,
    stripe,
    clearCart,
    t,
    checkoutAddress,
    checkoutHouseNumber,
    checkoutCity,
  ]);

  const handlePay = async () => {
    if (selectedMethod === 'cash') {
      await handleCashPayment();
    } else {
      await handleCardPayment();
    }
  };

  const methods: { id: PaymentMethod; emoji: string; label: string }[] = [
    ...(canPayCash ? [{ id: 'cash' as const, emoji: '💵', label: t('payment.cash') }] : []),
    { id: 'card' as const, emoji: '💳', label: t('payment.card') },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.sm }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t('payment.total')}</Text>
          <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('payment.selectMethod')}</Text>
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodCard, isSelected && styles.methodCardSelected]}
              onPress={() => setSelectedMethod(method.id)}
              accessibilityLabel={method.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={styles.methodEmoji}>{method.emoji}</Text>
              <Text style={[styles.methodLabel, isSelected && styles.methodLabelSelected]}>
                {method.label}
              </Text>
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: Theme.spacing.md + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing}
          accessibilityLabel={t('payment.payNow')}
          accessibilityRole="button"
        >
          <Text style={styles.payButtonText}>
            {isProcessing
              ? t('payment.processing')
              : `${t('payment.payNow')} · ${formatPrice(totalAmount)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomLeftRadius: Theme.borderRadii.xl,
    borderBottomRightRadius: Theme.borderRadii.xl,
    ...Theme.shadows.sm,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.textInverse,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  totalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    ...Theme.shadows.md,
  },
  totalLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  totalValue: {
    fontSize: Theme.fontSizes.xxxl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.primary,
  },
  sectionTitle: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.lg,
    padding: Theme.spacing.md,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    minHeight: 64,
    ...Theme.shadows.sm,
  },
  methodCardSelected: { borderColor: Theme.colors.primary },
  methodEmoji: { fontSize: 28 },
  methodLabel: {
    flex: 1,
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    color: Theme.colors.text,
  },
  methodLabelSelected: { color: Theme.colors.primary, fontWeight: Theme.fontWeights.bold, fontFamily: Theme.fontFamily.bold },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: Theme.colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.primary,
  },
  footer: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  payButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.lg,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    ...Theme.shadows.flame,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
