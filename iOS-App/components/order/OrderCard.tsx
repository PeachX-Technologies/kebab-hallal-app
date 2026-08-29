import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { router } from 'expo-router';
import { Order } from '../../context/OrderContext';
import { CartItem } from '../../context/CartContext';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice } from '../../utils/priceUtils';
import OrderTimer from './OrderTimer';
import Theme from '../../theme';

interface OrderCardProps {
  order: Order;
  locale: string;
  isCurrent?: boolean;
}

function formatDate(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  pending:   { bg: 'rgba(245,124,0,0.1)',   text: '#E65100', dot: '#F57C00', border: 'rgba(245,124,0,0.25)' },
  preparing: { bg: 'rgba(33,150,243,0.1)',  text: '#1565C0', dot: '#2196F3', border: 'rgba(33,150,243,0.25)' },
  delivering:{ bg: 'rgba(156,39,176,0.1)',  text: '#7B1FA2', dot: '#9C27B0', border: 'rgba(156,39,176,0.25)' },
  delivered: { bg: 'rgba(46,125,50,0.1)',   text: '#2E7D32', dot: '#4CAF50', border: 'rgba(46,125,50,0.25)' },
  cancelled: { bg: 'rgba(211,47,47,0.1)',   text: '#C62828', dot: '#D32F2F', border: 'rgba(211,47,47,0.25)' },
};

const ClockSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`} width={12} height={12} />
);
const BagSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"/></svg>`} width={12} height={12} />
);
const TruckSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>`} width={12} height={12} />
);
const PhoneSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>`} width={16} height={16} />
);

export default function OrderCard({ order, locale, isCurrent }: OrderCardProps) {
  const { t } = useLocale();
  const rawMode = order.orderMode as string;
  const normalizedMode = rawMode === 'takeaway' ? 'pickup' : rawMode;
  const isDelivery = normalizedMode === 'delivery' || (order as any).deliveryMethod === 'delivery';
  const sc = statusConfig[order.status] || statusConfig.pending;

  const getItemName = (item: CartItem) => {
    const fallbackName = item.itemName || (item as any).name || '';
    if (!item.itemId) return fallbackName;
    const key = `menu.items.${item.itemId}.name`;
    const translated = t(key);
    return translated !== key ? translated : fallbackName;
  };

  const itemsSummary = order.items.slice(0, 3).map(getItemName).join(', ');
  const extraCount = order.items.length - 3;

  const handleTrack = () => {
    router.push({ pathname: '/order/[orderId]', params: { orderId: order.id } });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isCurrent && styles.cardCurrent]}
      onPress={handleTrack}
      activeOpacity={0.85}
      accessible
      accessibilityLabel={t('orders.trackOrder')}
    >
      {isCurrent && <View style={styles.currentStrip} />}

      <View style={styles.inner}>
        {/* Header: Order ref + badges */}
        <View style={styles.head}>
          <Text style={styles.orderRef}>
            {t('orders.orderReference')} #{order.id.slice(-8).toUpperCase()}
          </Text>
          <View style={styles.badgeRow}>
            {order.counter > 0 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>#{order.counter}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
              <Text style={[styles.statusBadgeText, { color: sc.text }]}>
                {t(`orders.status.${order.status}`)}
              </Text>
            </View>
            {order.scheduledAt && (
              <View style={styles.scheduledBadge}>
                <ClockSvg color="#F57C00" />
                <Text style={styles.scheduledBadgeText}>{t('checkout.scheduled.scheduledOrder')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Date */}
        <Text style={styles.date}>{formatDate(order.createdAt, locale)}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Mode + items summary */}
        <View style={styles.modePillRow}>
          <View style={[styles.modePill, isDelivery ? styles.deliveryPill : styles.pickupPill]}>
            {isDelivery
              ? <TruckSvg color="#7B1FA2" />
              : <BagSvg color="#2E7D32" />
            }
            <Text style={[styles.modePillText, { color: isDelivery ? '#7B1FA2' : '#2E7D32' }]}>
              {isDelivery ? t('orders.delivery') : t('orders.pickup')}
            </Text>
          </View>
        </View>
        <Text style={styles.summaryText} numberOfLines={2}>
          {itemsSummary}
          {extraCount > 0 && <Text style={styles.extraText}> +{extraCount} {t('orders.items').toLowerCase()}</Text>}
        </Text>

        {/* Timer */}
        {['pending', 'preparing', 'delivering'].includes(order.status) && (
          <OrderTimer order={order} />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          {order.status === 'pending' && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Alert.alert(t('orders.callToCancel'), '095 505 670')}
              activeOpacity={0.85}
            >
              <PhoneSvg />
              <Text style={styles.callBtnText}>{t('orders.callToCancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.lg,
    ...Theme.shadows.sm,
  },
  cardCurrent: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.md,
  },
  currentStrip: {
    height: 4,
    backgroundColor: Theme.colors.primary,
  },
  inner: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },

  // ── Head ──
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
  },
  orderRef: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
  },
  counterBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadii.full,
  },
  counterBadgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.extraBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.bold,
    letterSpacing: 0.2,
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
  },
  scheduledBadgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.semiBold,
    color: '#F57C00',
  },

  // ── Date ──
  date: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
  },

  // ── Mode + summary ──
  modePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
  },
  deliveryPill: {
    backgroundColor: 'rgba(156,39,176,0.08)',
    borderColor: 'rgba(156,39,176,0.2)',
  },
  pickupPill: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderColor: 'rgba(46,125,50,0.2)',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.semiBold,
  },
  summaryText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  extraText: {
    color: Theme.colors.primary,
  },

  // ── Footer ──
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  totalValue: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    color: Theme.colors.text,
    letterSpacing: -0.3,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
  },
  callBtnText: {
    color: '#fff',
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
  },
});
