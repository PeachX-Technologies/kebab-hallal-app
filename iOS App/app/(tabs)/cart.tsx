import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useCart } from '../../context/CartContext';
import { useAppState } from '../../context/AppStateContext';
import { useLocale } from '../../context/LocaleContext';
import { useMenu, MenuItem } from '../../context/MenuContext';
import { useTheme } from '../../context/ThemeContext';
import CartItemRow from '../../components/cart/CartItemRow';
import MenuImage from '../../components/menu/MenuImage';
import ItemDetailSheet from '../../components/menu/ItemDetailSheet';
import { formatPrice } from '../../utils/priceUtils';
import Theme from '../../theme';

const ClockSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`}
    width={30}
    height={30}
  />
);

const TruckSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`}
    width={30}
    height={30}
  />
);

const BagSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`}
    width={26}
    height={26}
  />
);

const ArrowSvg = () => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>`}
    width={18}
    height={18}
  />
);

const BagHeaderSvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`}
    width={16}
    height={16}
  />
);

export default function CartScreen() {
  const { t } = useLocale();
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const { orderMode, restaurantOpen, deliveryAvailable } = useAppState();
  const { categories } = useMenu();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedAntipasti, setSelectedAntipasti] = useState<MenuItem | null>(null);

  const antipastiItems = useMemo(() => {
    const cat = categories.find((c) => c.idname === 'antipasti');
    return cat?.items ?? [];
  }, [categories]);

  const handleAntipastiPress = useCallback((item: MenuItem) => {
    setSelectedAntipasti(item);
  }, []);

  const isDelivery = orderMode === 'delivery';
  const isClosed = !restaurantOpen;
  const isDeliveryUnavailable = !deliveryAvailable && isDelivery;
  const isBlocked = isClosed || isDeliveryUnavailable;

  const headerBlock = (
    <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + Theme.spacing.sm }]}>
      <View style={styles.headerInner}>
        <View style={styles.headerTitleRow}>
          <BagHeaderSvg color={colors.textInverse} />
          <Text style={[styles.headerTitle, { color: colors.textInverse }]}>{t('cart.title')}</Text>
          {itemCount > 0 && (
            <Text style={[styles.headerCount, { color: colors.textInverse }]}>
              ({itemCount})
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderBlockedBanner = () => {
    if (!isBlocked) return null;
    return (
      <View style={styles.blockedBanner}>
{isClosed ? (
            <>
              <View style={[styles.bannerIconCircle, { backgroundColor: colors.errorLight }]}>
                <ClockSvg color={colors.error} />
              </View>
              <View style={styles.bannerTextWrap}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>{t('restaurant.closedTitle')}</Text>
                <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>{t('restaurant.closedDesc')}</Text>
                <Text style={[styles.bannerHours, { color: colors.textSecondary }]}>
                  {t('restaurant.lunchHours')}
                  {'\n'}
                  {t('restaurant.dinnerHours')}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.bannerIconCircle, { backgroundColor: colors.warningLight }]}>
                <TruckSvg color={colors.warning} />
              </View>
              <View style={styles.bannerTextWrap}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>{t('delivery.unavailableTitle')}</Text>
                <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>{t('delivery.unavailableDesc')}</Text>
              </View>
            </>
          )}
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {headerBlock}
        {renderBlockedBanner()}
        <View style={styles.stateContainer}>
          <View style={[styles.iconCircleMuted, { backgroundColor: colors.surfaceElevated }]}>
            <BagSvg color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('cart.empty')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('cart.emptySubtitle')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {headerBlock}
      {renderBlockedBanner()}

      {antipastiItems.length > 0 && (
        <View style={styles.antipastiWrap}>
          <Text style={[styles.antipastiTitle, { color: colors.text }]}>{t('cart.addAntipasti')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.antipastiScroll}
          >
            {antipastiItems.map((ant) => {
              const antId = ant?.id ?? '';
              const antName = antId ? t(`menu.items.${antId}.name`) : t('cart.unknownItem');
              const antPrice = orderMode === 'delivery' ? (ant?.deliveryprice ?? 0) : (ant?.price ?? 0);
              return (
                <TouchableOpacity
                  key={antId || `antipasti-${Math.random()}`}
                  style={[styles.antipastiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleAntipastiPress(ant)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.antipastiCardImageWrap, { backgroundColor: colors.surface }]}>
                    <MenuImage
                      filename={ant?.image}
                      style={styles.antipastiCardImage}
                      resizeMode="contain"
                      placeholderStyle={{ width: '100%', height: '100%' }}
                      fallback={<Text style={styles.antipastiCardEmoji}>🥙</Text>}
                    />
                    <View style={[styles.antipastiCardPriceBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.antipastiCardPriceBadgeText}>
                        {formatPrice(antPrice)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.antipastiCardName, { color: colors.text }]} numberOfLines={2}>
                    {antName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Theme.spacing.lg + insets.bottom }]}>
        {isDelivery && (
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>{t('cart.deliveryChargesNote')}</Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>{t('cart.total')}</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(subtotal)}</Text>
        </View>

        <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            { backgroundColor: isBlocked ? colors.border : colors.primary },
            isBlocked && styles.checkoutButtonDisabled,
          ]}
          onPress={isBlocked ? undefined : () => router.push('/checkout')}
          activeOpacity={isBlocked ? 1 : 0.88}
          accessibilityLabel={t('cart.checkout')}
          accessibilityRole="button"
          accessibilityState={{ disabled: isBlocked }}
          disabled={isBlocked}
        >
          <Text style={[styles.checkoutButtonText, isBlocked && { color: colors.textDisabled }]}>{t('cart.checkout')}</Text>
          <ArrowSvg />
        </TouchableOpacity>
      </View>

      <ItemDetailSheet
        item={selectedAntipasti}
        visible={!!selectedAntipasti}
        onClose={() => setSelectedAntipasti(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
    borderBottomLeftRadius: Theme.borderRadii.xl,
    borderBottomRightRadius: Theme.borderRadii.xl,
    ...Theme.shadows.sm,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    opacity: 0.8,
  },

  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xxl,
    gap: Theme.spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
  },
  iconCircleMuted: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: Theme.fontSizes.xs,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
  stateHours: {
    fontSize: Theme.fontSizes.xs,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: Theme.fontSizes.xs,
    textAlign: 'center',
    maxWidth: 200,
    lineHeight: 18,
  },

  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.md,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  bannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  bannerDesc: {
    fontSize: Theme.fontSizes.xs,
    lineHeight: 18,
  },
  bannerHours: {
    fontSize: Theme.fontSizes.xs,
    lineHeight: 18,
  },

  checkoutButtonDisabled: {
    opacity: 0.5,
  },

  listContent: {
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
  },
  separator: {
    height: Theme.spacing.sm,
  },

  footer: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    borderTopLeftRadius: Theme.borderRadii.xl,
    borderTopRightRadius: Theme.borderRadii.xl,
    gap: Theme.spacing.xs,
    borderTopWidth: 1,
    ...Theme.shadows.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  feeValue: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.xs,
  },
  totalLabel: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  totalValue: {
    fontSize: Theme.fontSizes.lg,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    letterSpacing: -0.5,
  },
  footerDivider: {
    height: 1,
    marginHorizontal: -Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
  },

  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    height: 52,
    borderRadius: Theme.borderRadii.lg,
    ...Theme.shadows.flame,
  },
  checkoutButtonText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: '#fff',
  },

  antipastiWrap: {
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
  },
  antipastiTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  antipastiScroll: {
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  antipastiCard: {
    width: 110,
    borderRadius: Theme.borderRadii.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  antipastiCardImageWrap: {
    width: '100%',
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  antipastiCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  antipastiCardEmoji: {
    fontSize: 28,
  },
  antipastiCardPriceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Theme.borderRadii.full,
  },
  antipastiCardPriceBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  antipastiCardName: {
    fontSize: 11,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 7,
    lineHeight: 14,
  },
});
