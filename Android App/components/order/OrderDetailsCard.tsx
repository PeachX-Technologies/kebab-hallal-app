import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useLocale } from '../../context/LocaleContext';
import { formatPrice } from '../../utils/priceUtils';
import type { Order } from '../../context/OrderContext';
import Theme from '../../theme';

const BagSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.primary}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"/></svg>`} width={18} height={18} />
);
const DollarSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${Theme.colors.textSecondary}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`} width={16} height={16} />
);
const CardSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${Theme.colors.textSecondary}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>`} width={16} height={16} />
);
const ClockSvg = ({ color }: { color: string }) => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`} width={14} height={14} />
);
const CalendarSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.primary}"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>`} width={14} height={14} />
);
const HashSvg = () => (
  <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${Theme.colors.textSecondary}"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"/></svg>`} width={12} height={12} />
);

function toTimeslotLabel(iso: string) {
  const d = new Date(iso);
  const h1 = d.getHours();
  const m1 = d.getMinutes();
  const end = new Date(d.getTime() + 30 * 60 * 1000);
  const h2 = end.getHours();
  const m2 = end.getMinutes();
  return `${String(h1).padStart(2, '0')}:${String(m2).padStart(2, '0')} - ${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
}

interface OrderDetailsCardProps {
  order: Order;
}

export default function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const { t } = useLocale();

  const isDelivery = order.orderMode === 'delivery' || (order as any).deliveryMethod === 'delivery';

  const getItemName = (item: any) => {
    return item.itemName || item.name || '';
  };

  const buildOptionLabel = (option: any) => {
    if (!option) return '';
    return option.price
      ? `${option.name ?? ''} (+${formatPrice(option.price)})`
      : (option.name ?? '');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <BagSvg />
        <Text style={styles.headerTitle}>{t('orderTracker.detailsTitle')}</Text>
      </View>

      <View style={styles.badgeRow}>
        {order.counter > 0 && (
          <View style={styles.badge}>
            <HashSvg />
            <Text style={styles.badgeText}>#{order.counter}</Text>
          </View>
        )}
        <View style={[styles.badge, styles.modeBadge]}>
          <Text style={styles.badgeText}>
            {isDelivery ? t('orderTracker.delivery') : t('orderTracker.pickup')}
          </Text>
        </View>
        {order.scheduledAt && (
          <View style={[styles.badge, styles.scheduledBadge]}>
            <CalendarSvg />
            <Text style={[styles.badgeText, { color: Theme.colors.primary }]}>{t('orderTracker.scheduledOrder')}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsList}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{item.quantity}×</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{getItemName(item)}</Text>
              {(item as any).selectedOptions && Object.keys((item as any).selectedOptions || {}).length > 0 && (
                <View style={styles.optionsList}>
                  {Object.values((item as any).selectedOptions).flatMap((value: any) => {
                    const arr = Array.isArray(value) ? value : [value];
                    return arr.map((opt: any, idx: number) => (
                      <Text key={`${item.id}-opt-${idx}`} style={styles.optionText}>
                        · {buildOptionLabel(opt)}
                      </Text>
                    ));
                  })}
                </View>
              )}
            </View>
            <Text style={styles.itemPrice}>{formatPrice(item.totalPrice)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{t('orderTracker.subtotal')}</Text>
        <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
      </View>

      {isDelivery && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('orderTracker.deliveryFee')}</Text>
          <Text style={styles.summaryValue}>
            {formatPrice((order as any).deliveryFee || 0)}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Text style={styles.paymentLabel}>{t('orderTracker.paymentMethod')}</Text>
        <View style={styles.paymentValueRow}>
          {order.paymentMethod === 'cash' ? (
            <DollarSvg />
          ) : (
            <CardSvg />
          )}
          <Text style={styles.summaryValue}>
            {order.paymentMethod === 'cash'
              ? t('orderTracker.cash')
              : t('orderTracker.online')}
          </Text>
        </View>
      </View>

      {order.deliveryTime && !order.scheduledAt && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('orderTracker.deliveryEta')}</Text>
          <Text style={[styles.summaryValue, styles.etaValue]}>
            <ClockSvg color={Theme.colors.secondary} /> ~{order.deliveryTime} min
          </Text>
        </View>
      )}

      {order.scheduledAt && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('orderTracker.scheduledOrder')}</Text>
          <Text style={[styles.summaryValue, { color: Theme.colors.primary }]}>
            <CalendarSvg /> {toTimeslotLabel(order.scheduledAt)}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('orderTracker.total')}</Text>
        <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.xl,
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadii.full,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modeBadge: {
    backgroundColor: 'rgba(156,39,176,0.08)',
    borderColor: 'rgba(156,39,176,0.2)',
  },
  scheduledBadge: {
    backgroundColor: 'rgba(249,18,26,0.08)',
    borderColor: 'rgba(249,18,26,0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginHorizontal: -Theme.spacing.md,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  qtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qtyText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.extraBold,
    color: '#fff',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    color: Theme.colors.text,
  },
  optionsList: {
    marginTop: 3,
    gap: 1,
  },
  optionText: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
  },
  itemPrice: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    color: Theme.colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    color: Theme.colors.text,
  },
  paymentLabel: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
  },
  paymentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  etaValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.extraBold,
    color: Theme.colors.text,
  },
  totalValue: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    color: Theme.colors.primary,
    letterSpacing: -0.3,
  },
});
