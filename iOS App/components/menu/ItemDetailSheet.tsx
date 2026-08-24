import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MenuItem } from '../../context/MenuContext';
import { useMenu } from '../../context/MenuContext';
import { useCart, ItemCustomization } from '../../context/CartContext';
import { useAppState } from '../../context/AppStateContext';
import { useLocale } from '../../context/LocaleContext';
import { NormalizedOption } from '../../context/MenuContext';
import { calculateLineTotal, formatPrice, getItemPrice } from '../../utils/priceUtils';
import { getMenuImageSource } from '../../lib/menuImages';
import MenuImage from './MenuImage';
import BottomSheet from '../ui/BottomSheet';
import QuestionRenderer from './QuestionRenderer';
import Theme from '../../theme';

interface ItemDetailSheetProps {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
}

const drinkImageKeys: Record<string, string> = {
  'Acqua naturale': 'BV19.jpg',
  'Acqua frizzante': 'BV20.jpg',
  'Coca Cola 33cl': 'BV08.jpg',
  'Coca Cola Zero 33cl': 'BV10.jpg',
  'Fanta 33cl': 'BV09.jpg',
  'Sprite 33cl': 'BV11.jpg',
  'Pepsi 33cl': 'BV15.png',
  'Pepsi twist 33cl': 'BV16.png',
  'Lemon soda 33cl': 'BV12.jpg',
  'Chinotto 33cl': 'BV13.jpg',
  'The pesca 33cl': 'BV17.jpg',
  'The limone 33cl': 'BV18.jpg',
  'Coca 500ml': 'BV07.jpg',
  'Monster Energy 500ml': 'BV01.jpg',
  'Monster Mango Loco 500ml': 'BV02.jpg',
  'Monster Nitro 500ml': 'BV05.jpg',
  'Monster Energy Zero 500ml': 'BV04.png',
  'Redbull 250ml': 'BV06.jpg',
};

const MinusSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>`}
    width={18}
    height={18}
  />
);

const PlusSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>`}
    width={18}
    height={18}
  />
);

const CartSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"/></svg>`}
    width={20}
    height={20}
  />
);

export default function ItemDetailSheet({ item, visible, onClose }: ItemDetailSheetProps) {
  const { t } = useLocale();
  let getQuestion: (id: string) => any = () => undefined;
  let addItem: any = () => {};
  let orderMode: 'pickup' | 'delivery' = 'pickup';
  try {
    getQuestion = useMenu().getQuestion;
  } catch {}
  try {
    addItem = useCart().addItem;
  } catch {}
  try {
    orderMode = useAppState().orderMode;
  } catch {}

  const [localItem, setLocalItem] = useState<MenuItem | null>(item);
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (item) {
      setLocalItem(item);
      setQuantity(1);
      setSelections({});
      setErrors({});
    }
  }, [item]);

  const activeItem = item ?? localItem;
  const itemId = activeItem?.id ?? '';
  const itemName = itemId ? t(`menu.items.${itemId}.name`) : t('cart.unknownItem');
  const itemDescription = activeItem ? t(`menu.items.${itemId}.description`) : '';

  const questions = (activeItem?.questions ?? [])
    .map((qId) => getQuestion(qId))
    .filter(Boolean) as NonNullable<ReturnType<typeof getQuestion>>[];

  const basePrice = activeItem ? getItemPrice(activeItem, orderMode) : 0;

  const questionOptionImages: Record<string, Record<string, { uri: string } | number>> = {};
  for (const q of questions) {
    const images: Record<string, { uri: string } | number> = {};
    for (const opt of q.options) {
      const filename = drinkImageKeys[opt.name];
      if (filename) {
        const source = getMenuImageSource(filename);
        if (source) images[opt.name] = source;
      }
    }
    if (Object.keys(images).length > 0) questionOptionImages[q.id] = images;
  }

  const selectedOptions: NormalizedOption[] = questions.flatMap((q) => {
    const sel = selections[q.id];
    if (!sel) return [];
    const names = Array.isArray(sel) ? sel : [sel];
    return names
      .map((name) => q.options.find((o: NormalizedOption) => o.name === name))
      .filter(Boolean) as NormalizedOption[];
  });

  const runningTotal = calculateLineTotal(basePrice, selectedOptions, quantity);

  const handleChange = (questionId: string, value: string | string[]) => {
    setSelections((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: false }));
  };

  const handleAddToCart = () => {
    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    for (const q of questions) {
      if (q.type === 'single_choice' && q.required && !selections[q.id]) {
        newErrors[q.id] = true;
        hasError = true;
      }
    }
    if (hasError) { setErrors(newErrors); return; }
    if (!activeItem) return;
    addItem(activeItem, { ...selections } as ItemCustomization, selectedOptions, quantity, orderMode);
    setQuantity(1);
    setSelections({});
    setErrors({});
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container} key={activeItem?.id}>

        {/* ── Hero image ── */}
        <View style={styles.imageWrap}>
          <MenuImage
            filename={activeItem?.image}
            style={styles.image}
            resizeMode="contain"
            placeholderStyle={styles.imagePlaceholder}
            fallback={<Text style={styles.placeholderEmoji}>🥙</Text>}
          />
        </View>

        {/* ── Item info ── */}
        <View style={styles.infoSection}>
          <View style={styles.infoTop}>
            <Text style={styles.itemName}>{itemName}</Text>
            <View style={styles.pricePill}>
              <Text style={styles.basePrice}>{formatPrice(basePrice)}</Text>
            </View>
          </View>
          {activeItem?.description ? (
            <Text style={styles.itemDescription}>{itemDescription}</Text>
          ) : null}
        </View>

        {/* ── Divider ── */}
        {questions.length > 0 && <View style={styles.sectionDivider} />}

        {/* ── Questions ── */}
        {questions.length > 0 && (
          <View style={styles.questionsSection}>
            {questions.map((q) => {
              const isDrinks = !!questionOptionImages[q.id] && Object.keys(questionOptionImages[q.id]).length > 0;
              const variant = isDrinks ? 'horizontal' : q.type === 'multiple_choice' ? 'cards' : 'list';
              return (
                <QuestionRenderer
                  key={q.id}
                  question={q}
                  selectedValues={selections[q.id]}
                  onChange={handleChange}
                  hasError={errors[q.id]}
                  optionImages={questionOptionImages[q.id]}
                  variant={variant}
                />
              );
            })}
          </View>
        )}

        {/* ── Divider ── */}
        <View style={styles.sectionDivider} />

        {/* ── Quantity + Add to cart ── */}
        <View style={styles.footer}>
          {/* Quantity stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepBtn, quantity <= 1 && styles.stepBtnDisabled]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              accessibilityLabel="Decrease quantity"
              accessibilityRole="button"
            >
              <MinusSvg color={quantity <= 1 ? Theme.colors.textDisabled : '#fff'} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQuantity((q) => q + 1)}
              accessibilityLabel="Increase quantity"
              accessibilityRole="button"
            >
              <PlusSvg color={'#fff'} />
            </TouchableOpacity>
          </View>

          {/* Add to cart button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            accessibilityLabel={`${t('itemDetail.addToCart')} ${formatPrice(runningTotal)}`}
            accessibilityRole="button"
            activeOpacity={0.88}
          >
            <CartSvg />
            <Text style={styles.addButtonText}>{t('itemDetail.addToCart')}</Text>
            <View style={styles.addButtonPricePill}>
              <Text style={styles.addButtonPrice}>{formatPrice(runningTotal)}</Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Theme.spacing.xl,
  },

  // ── Image ──────────────────────────────────────────────────
  imageWrap: {
    width: '100%',
    height: 220,
    backgroundColor: Theme.colors.surface,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 72,
  },

  // ── Info ───────────────────────────────────────────────────
  infoSection: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Theme.spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    color: Theme.colors.text,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  pricePill: {
    backgroundColor: Theme.colors.surfaceElevated,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 2,
  },
  basePrice: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.primary,
  },
  itemDescription: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },

  // ── Dividers / Sections ────────────────────────────────────
  sectionDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginHorizontal: Theme.spacing.md,
  },
  questionsSection: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },

  // ── Footer ─────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 4,
    gap: 2,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderWidth: 0,
  },
  stepBtnDisabled: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  qtyValue: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: Theme.colors.text,
    minWidth: 28,
    textAlign: 'center',
  },

  // Add button
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingLeft: Theme.spacing.md,
    paddingRight: 6,
    height: 52,
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.full,
    ...Theme.shadows.flame,
  },
  addButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  addButtonPricePill: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: Theme.borderRadii.full,
  },
  addButtonPrice: {
    color: '#fff',
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
});
