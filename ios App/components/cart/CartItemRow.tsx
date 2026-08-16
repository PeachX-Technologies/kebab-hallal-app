import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CartItem } from '../../context/CartContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice } from '../../utils/priceUtils';
import MenuImage from '../menu/MenuImage';
import Theme from '../../theme';

interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

const MinusSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>`}
    width={14}
    height={14}
  />
);

const PlusSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>`}
    width={14}
    height={14}
  />
);

const TrashSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>`}
    width={16}
    height={16}
  />
);

export default function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const isMinQty = item.quantity <= 1;
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const MAX_VISIBLE_OPTIONS = 3;

  const flatOptions = useMemo(() => {
    const result: { name: string; price: number }[] = [];
    for (const value of Object.values(item.selectedOptions ?? {})) {
      const arr = Array.isArray(value) ? value : [value];
      arr.forEach((opt: any) => {
        if (opt && typeof opt === 'object' && opt.name) {
          result.push({ name: opt.name, price: opt.price || 0 });
        } else if (typeof opt === 'string') {
          result.push({ name: opt, price: 0 });
        }
      });
    }
    return result;
  }, [item.selectedOptions]);

  const displayOptions = optionsExpanded ? flatOptions : flatOptions.slice(0, MAX_VISIBLE_OPTIONS);
  const remainingCount = flatOptions.length - MAX_VISIBLE_OPTIONS;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.thumbWrap, { backgroundColor: colors.surfaceElevated }]}>
        <MenuImage
          key={item.id}
          filename={item.image}
          style={styles.thumb}
          resizeMode="contain"
          fallback={<Text style={styles.thumbEmoji}>🥙</Text>}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {t(`menu.items.${item.itemId}.name`)}
          </Text>
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`${t('cart.remove')} ${t(`menu.items.${item.itemId}.name`)}`}
          >
            <TrashSvg color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {flatOptions.length > 0 && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setOptionsExpanded((v) => !v)}
            style={styles.optionsRow}
          >
            {displayOptions.map((opt, i) => (
              <View
                key={i}
                style={[styles.optionBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              >
                <Text style={[styles.optionText, { color: colors.primary }]} numberOfLines={1}>
                  {opt.name}
                </Text>
                {opt.price > 0 && (
                  <Text style={[styles.optionPrice, { color: colors.primary }]}>
                    +{formatPrice(opt.price)}
                  </Text>
                )}
              </View>
            ))}
            {!optionsExpanded && remainingCount > 0 && (
              <View style={[styles.optionBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.optionMoreText, { color: colors.textSecondary }]}>
                  +{remainingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomRow}>
          <View style={[styles.stepper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.primary }, isMinQty && { opacity: 0.4 }]}
              onPress={onDecrement}
              disabled={isMinQty}
              accessibilityLabel="Decrease quantity"
            >
              <MinusSvg color="#fff" />
            </TouchableOpacity>

            <Text style={[styles.qtyValue, { color: colors.text }]}>{item.quantity}</Text>

            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.primary }]}
              onPress={onIncrement}
              accessibilityLabel="Increase quantity"
            >
              <PlusSvg color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.lineTotal, { color: colors.text }]}>
            {formatPrice(item.totalPrice)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: Theme.borderRadii.lg,
    padding: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    borderWidth: 1,
  },

  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    flexShrink: 0,
    alignSelf: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbEmoji: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 56,
  },

  info: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    lineHeight: 18,
  },

  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Theme.borderRadii.sm,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    maxWidth: 70,
  },
  optionPrice: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    opacity: 0.75,
  },
  optionMoreText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
    paddingTop: 2,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    minWidth: 20,
    textAlign: 'center',
  },

  lineTotal: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
