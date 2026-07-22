import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MenuItem } from '../../context/MenuContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { OrderMode } from '../../context/AppStateContext';
import { formatPrice, getItemPrice } from '../../utils/priceUtils';
import MenuImage from './MenuImage';
import Theme from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Theme.spacing.md * 2 - 12) / 2;

interface MenuItemCardProps {
  item: MenuItem;
  orderMode: OrderMode;
  onPress: (item: MenuItem) => void;
}

const PlusSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`}
    width={16}
    height={16}
  />
);

export default function MenuItemCard({ item, orderMode, onPress }: MenuItemCardProps) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const price = getItemPrice(item, orderMode);
  const itemName = t(`menu.items.${item.id}.name`);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
      accessibilityLabel={`${itemName}, ${formatPrice(price)}`}
      accessibilityRole="button"
    >
      <View style={[styles.imageContainer]}>
        <MenuImage
          filename={item.image}
          style={styles.image}
          resizeMode="contain"
          fallback={<Text style={styles.placeholderEmoji}>🥙</Text>}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{itemName}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(price)}</Text>
          <TouchableOpacity
            style={[styles.plusBtn, { backgroundColor: colors.primary }]}
            onPress={() => onPress(item)}
            activeOpacity={0.8}
          >
            <PlusSvg color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Theme.shadows.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    padding: Theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderEmoji: { fontSize: 36 },
  info: {
    padding: Theme.spacing.sm,
    gap: 2,
  },
  name: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
  price: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  plusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
