import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { subscribeOrder } from '../../services/orderService';
import { useLocale } from '../../context/LocaleContext';
import { useOrders, Order, OrderStatus } from '../../context/OrderContext';
import OrderTracker from '../../components/order/OrderTracker';
import DeliveryInfoCard from '../../components/order/DeliveryInfoCard';
import OrderDetailsCard from '../../components/order/OrderDetailsCard';
import Theme from '../../theme';
import type { OrderData } from '../../services/orderService';

const ArrowLeftSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#fff"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/></svg>`} width={22} height={22} />
);
const RefreshSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="rgba(255,255,255,0.7)"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"/></svg>`} width={14} height={14} />
);
const PhoneSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>`} width={16} height={16} />
);

function orderDataToOrder(id: string, data: OrderData): Order {
  const items = (data.items || []).map((item: any) => ({
    id: item.id ?? item.itemId ?? '',
    itemId: item.itemId ?? item.menuItemId ?? '',
    itemName: item.itemName ?? item.name ?? '',
    image: item.image ?? '',
    itemImage: item.itemImage ?? '',
    basePrice: item.basePrice ?? 0,
    baseDeliveryPrice: item.baseDeliveryPrice ?? 0,
    selectedOptions: item.selectedOptions ?? {},
    quantity: item.quantity ?? 1,
    totalPrice: item.totalPrice ?? 0,
    totalDeliveryPrice: item.totalDeliveryPrice ?? 0,
    adPrice: item.adPrice ?? 0,
  }));
  const orderMode = ((data as any).orderMode || data.deliveryMethod || 'pickup') as 'pickup' | 'delivery';
  const paymentMethod = (data.paymentMethod === 'Stripe' || data.paymentMethod === 'card' || data.paymentMethod === 'Card') ? ('card' as const) : ('cash' as const);
  return {
    id,
    counter: data.counter || 0,
    status: (data.status as OrderStatus) || 'pending',
    items,
    subtotal: data.totalAmount || 0,
    totalAmount: data.totalAmount || 0,
    orderMode,
    paymentMethod,
    deliveryAddress: data.deliveryAddress
      ? { house: data.deliveryAddress.house || '', street: data.deliveryAddress.street || '', city: data.deliveryAddress.city || 'Catania' }
      : undefined,
    deliveryNotes: data.deliveryNotes || data.additionalInfo || '',
    clientName: data.clientName || '',
    clientPhone: data.clientPhone || '',
    createdAt: (data as any).createdAt?.toDate ? (data as any).createdAt.toDate().getTime() : (typeof data.createdAt === 'string' ? new Date(data.createdAt).getTime() : Date.now()),
    updatedAt: (data as any).updatedAt?.toDate ? (data as any).updatedAt.toDate().getTime() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt).getTime() : Date.now()),
    deliveryTime: data.deliveryTime ?? 30,
    scheduledAt: data.scheduledAt || undefined,
  };
}

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useLocale();
  const { orders } = useOrders();
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const localOrderRef = useRef<Order | null>(null);

  // Track locally-stored orders (e.g. guest orders that only exist on-device).
  // A real order placed via Firestore will still resolve through subscribeOrder.
  useEffect(() => {
    if (!orderId) return;
    const local =
      orders.find((o) => o.id === orderId || o.stripePaymentIntentId === orderId) || null;
    localOrderRef.current = local;
    if (local) {
      setOrderData(local);
      setNotFound(false);
      setLoading(false);
    }
  }, [orderId, orders]);

  useEffect(() => {
    if (!orderId) return;

    unsubRef.current = subscribeOrder(
      orderId,
      (data, realDocId) => {
        if (!data) {
          if (!localOrderRef.current) {
            setNotFound(true);
          }
          setLoading(false);
          return;
        }
        const mapped = orderDataToOrder(realDocId || orderId, data);
        setOrderData(mapped);
        setNotFound(false);
        setLoading(false);
      },
      () => {
        if (!localOrderRef.current) {
          setNotFound(true);
        }
        setLoading(false);
      },
    );

    return () => {
      unsubRef.current?.();
    };
  }, [orderId]);

  const handleCall = useCallback(() => {
    Linking.openURL('tel:+39095505670');
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (notFound || !orderData) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeftSvg />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orderTracker.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{t('orderTracker.notFound')}</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>{t('orderTracker.backToMenu')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const address = orderData.deliveryAddress
    ? [orderData.deliveryAddress.house, orderData.deliveryAddress.street].filter(Boolean).join(', ')
    : '';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeftSvg />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('orderTracker.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('orderTracker.orderRef', { id: orderData.id })}
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <RefreshSvg />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.trackerCard}>
          <OrderTracker initialStatus={orderData.status} />
        </View>

        <OrderDetailsCard order={orderData} />

        <DeliveryInfoCard
          address={address}
          deliveryTime={orderData.deliveryTime}
          updatedAt={orderData.updatedAt}
          status={orderData.status}
          scheduledAt={orderData.scheduledAt}
        />

        {orderData.status !== 'delivered' && orderData.status !== 'cancelled' && (
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
            <PhoneSvg />
            <Text style={styles.contactBtnText}>{t('orderTracker.callRestaurant')}</Text>
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomLeftRadius: Theme.borderRadii.xl,
    borderBottomRightRadius: Theme.borderRadii.xl,
    ...Theme.shadows.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.md,
  },
  loadingText: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  homeBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.primary,
  },
  homeBtnText: {
    color: '#fff',
    fontWeight: Theme.fontWeights.bold,
    fontSize: Theme.fontSizes.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  trackerCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: '#2196F3',
  },
  contactBtnText: {
    color: '#fff',
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
  },
});
