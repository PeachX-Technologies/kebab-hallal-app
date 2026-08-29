import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  LayoutChangeEvent,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useMenu } from '../../context/MenuContext';
import { useAppState } from '../../context/AppStateContext';
import { useLocale } from '../../context/LocaleContext';
import { MenuItem, MenuItem as MenuItemType } from '../../context/MenuContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import MenuItemCard from '../../components/menu/MenuItemCard';
import MenuImage from '../../components/menu/MenuImage';
import ItemDetailSheet from '../../components/menu/ItemDetailSheet';

import BottomSheet from '../../components/ui/BottomSheet';
import HeroCarousel from '../../components/home/HeroCarousel';
import CategoryTabs from '../../components/menu/CategoryTabs';
import Theme from '../../theme';
import { RESTAURANT_PHONE, RESTAURANT_PHONE_RAW } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = ((SCREEN_WIDTH - 2 * Theme.spacing.md) * 544) / 1904;

const bannerImages: Record<string, any> = {
  'menu-completo': require('../../assets/banner/menu-completo.png'),
  kebab: require('../../assets/banner/kebab.png'),
  vegetariano: require('../../assets/banner/vegetariano.png'),
  burger: require('../../assets/banner/burger.png'),
  antipasti: require('../../assets/banner/antipasti.png'),
  bevande: require('../../assets/banner/bevande.png'),
};

/* ─── Icons ─────────────────────────────────────────────────── */
const BagSvg = ({ size, color }: { size: number; color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>`}
    width={size}
    height={size}
  />
);

const BikeSvg = ({ size, color }: { size: number; color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M13 17h-2L8 8l-3 3"/><path d="M13 17V8l2 3h4"/><path d="M8 8h5"/></svg>`}
    width={size}
    height={size}
  />
);

const CheckSvg = ({ size, color }: { size: number; color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`}
    width={size}
    height={size}
  />
);

const PhoneSvg = ({ size, color }: { size: number; color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/></svg>`}
    width={size}
    height={size}
  />
);

/* ─── Order Mode Modal Option ───────────────────────────────── */
function ModeOption({
  mode,
  title,
  selected,
  onPress,
  colors,
  disabled,
}: {
  mode: 'pickup' | 'delivery';
  title: string;
  selected: boolean;
  onPress: () => void;
  colors: typeof Theme.colors;
  disabled?: boolean;
}) {
  const isDel = mode === 'delivery';
  return (
    <TouchableOpacity
      style={[
        opt.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        selected && { borderColor: colors.primary, backgroundColor: colors.surface },
        disabled && opt.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <View style={[opt.iconWrap, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        <Image
          source={isDel ? require('../../assets/icons/delivery.webp') : require('../../assets/icons/takeaway.webp')}
          style={opt.iconImage}
        />
      </View>
      <Text style={[opt.title, { color: colors.text }, selected && { color: colors.primary }]}>{title}</Text>
      <View style={[opt.checkOuter, { borderColor: colors.border }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        {selected && (
          <SvgXml
            xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`}
            width={14}
            height={14}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const opt = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadii.lg,
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.flame,
  },
  iconImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  title: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    textAlign: 'center',
    flexShrink: 1,
  },
  checkOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* ─── Cart Nudge Tooltip ──────────────────────────────────────── */
function CartNudge({ colors }: { colors: typeof Theme.colors }) {
  const { itemCount } = useCart();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (itemCount > 0) {
      tooltipAnim.setValue(0);
      Animated.spring(tooltipAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 200,
      }).start(() => {
        floatAnim.setValue(0);
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
        ).start();
      });
    } else {
      floatAnim.setValue(0);
    }
  }, [itemCount, tooltipAnim, floatAnim]);

  const tabPadding = Math.max(16, insets.left + 8);
  const cartTabCenter = tabPadding + (screenWidth - 2 * tabPadding) * 0.375;

  const translateY = Animated.add(
    tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
    floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
  );

  if (itemCount <= 0) return null;

  return (
    <Animated.View
      style={[
        nudgeStyles.tooltip,
        {
          left: cartTabCenter - 55,
          bottom: 4,
          opacity: tooltipAnim,
          transform: [{ translateY }],
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text style={nudgeStyles.tooltipText}>{t('home.orderHere')}</Text>
      <View style={[nudgeStyles.tooltipArrow, { borderTopColor: colors.primary }]} />
    </Animated.View>
  );
}

const nudgeStyles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 110,
    zIndex: 100,
    ...Theme.shadows.md,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

/* ─── Category Drawer (bottom sheet) ────────────────────────── */
function CategoryDrawer({
  visible,
  onClose,
  categories,
  activeCategory,
  onSelectCategory,
  t,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  categories: any[];
  activeCategory: string;
  onSelectCategory: (idname: string) => void;
  t: (key: string) => string;
  colors: typeof Theme.colors;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={drawer.content}>
        <Text style={[drawer.title, { color: colors.text }]}>{t('home.allCategories')}</Text>
        {categories.map((cat) => {
          const catName = t(`menu.categories.${cat.idname}.name`);
          const isActive = cat.idname === activeCategory;
          return (
            <TouchableOpacity
              key={cat.idname}
              style={[drawer.row, isActive && { backgroundColor: '#FFF0F0' }]}
              onPress={() => {
                onSelectCategory(cat.idname);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={[drawer.rowIcon, { backgroundColor: colors.surfaceElevated }, isActive && { backgroundColor: colors.primary }]}>
                <MenuImage
                  filename={cat.items[0]?.image}
                  style={drawer.rowImg}
                  resizeMode="cover"
                  placeholderStyle={isActive && drawer.rowIconActive ? { backgroundColor: undefined } : undefined}
                  fallback={<Text style={drawer.rowEmoji}>🥙</Text>}
                />
              </View>
              <Text style={[drawer.rowText, { color: colors.text }, isActive && { color: colors.primary }]}>
                {catName}
              </Text>
              {isActive && <CheckSvg size={16} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const drawer = StyleSheet.create({
  content: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
    gap: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    marginBottom: Theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.lg,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadii.md,
    overflow: 'hidden',
  },
  rowImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rowEmoji: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 44,
  },
  rowText: {
    flex: 1,
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
});

/* ─── Main Screen ────────────────────────────────────────────── */
export default function HomeScreen() {
  const { t } = useLocale();
  const { categories } = useMenu();
  const { orderMode, setOrderMode, restaurantOpen, deliveryAvailable } = useAppState();
  const { recalculatePrices } = useCart();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const callBtnW = 36;
  const modeBtnW = 40;
  const sidePadding = Theme.spacing.md * 2;
  const gaps = 8;
  const maxLogoW = screenWidth - sidePadding - callBtnW - modeBtnW - gaps * 2;
  const logoW = Math.min(130, Math.max(70, maxLogoW));
  const logoH = logoW * (36 / 130);

  const itemsMap = useMemo(() => {
    const map: Record<string, MenuItemType> = {};
    for (const cat of categories) {
      for (const item of cat.items) {
        map[item.id] = item;
      }
    }
    return map;
  }, [categories]);

  const handleModeChange = useCallback((mode: 'pickup' | 'delivery') => {
    if (mode === 'delivery' && !deliveryAvailable) return;
    setOrderMode(mode);
  }, [setOrderMode, deliveryAvailable]);

  useEffect(() => {
    recalculatePrices(itemsMap, orderMode);
  }, [orderMode, recalculatePrices, itemsMap]);

  const [activeCategory, setActiveCategory] = useState(categories[0]?.idname ?? '');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showOrderModeModal, setShowOrderModeModal] = useState(true);
  const [pendingMode, setPendingMode] = useState<'pickup' | 'delivery'>('pickup');
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [heroHeight, setHeroHeight] = useState(0);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  useEffect(() => {
    if (!deliveryAvailable && pendingMode === 'delivery') {
      setPendingMode('pickup');
    }
  }, [deliveryAvailable, pendingMode]);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const isTappingTab = useRef(false);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSectionLayout = useCallback((catIdname: string, y: number) => {
    sectionOffsets.current[catIdname] = y;
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y + 20;
      if (heroHeight > 0) {
        setIsTabsSticky(scrollY >= heroHeight);
      }
      if (isTappingTab.current) return;
      const entries = Object.entries(sectionOffsets.current);
      let current = categories[0]?.idname ?? '';
      for (let i = entries.length - 1; i >= 0; i--) {
        if (scrollY >= entries[i][1]) {
          current = entries[i][0];
          break;
        }
      }
      if (current !== activeCategory) {
        setActiveCategory(current);
      }
    },
    [activeCategory, categories, heroHeight],
  );

  const handleMomentumEnd = useCallback(() => {
    if (isTappingTab.current) {
      clearTimeout(tapTimerRef.current);
      isTappingTab.current = false;
    }
  }, []);

  const handleSelectCategory = useCallback((catIdname: string) => {
    setActiveCategory(catIdname);
    isTappingTab.current = true;
    const offset = sectionOffsets.current[catIdname];
    if (offset !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, offset - 10), animated: true });
    }
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      isTappingTab.current = false;
    }, 600);
  }, []);

  const handleConfirmOrderMode = () => {
    handleModeChange(pendingMode);
    setShowOrderModeModal(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={{ backgroundColor: colors.primary }}>
          <View style={{ paddingTop: insets.top }}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/icons/logo.png')}
                style={[styles.logoImg, { width: logoW, height: logoH }]}
              />
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${RESTAURANT_PHONE_RAW}`)}
                  activeOpacity={0.7}
                >
                  <PhoneSvg size={14} color="#fff" />
                  <Text style={styles.callBtnText}>{RESTAURANT_PHONE}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modeBtn}
                  onPress={() => setShowOrderModeModal(true)}
                  activeOpacity={0.7}
                >
                  {orderMode === 'pickup' ? (
                    <BagSvg size={20} color="#fff" />
                  ) : (
                    <BikeSvg size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
          stickyHeaderIndices={[1]}
        >
          <View onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}>
            <HeroCarousel />
          </View>
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={handleSelectCategory}
            t={t}
            colors={colors}
            isSticky={isTabsSticky}
            onOpenDrawer={() => setShowCategoryDrawer(true)}
          />
          {categories.map((cat) => (
            <View
              key={cat.idname}
              onLayout={(e: LayoutChangeEvent) =>
                handleSectionLayout(cat.idname, e.nativeEvent.layout.y)
              }
            >
              <View style={styles.bannerWrap}>
                <Image source={bannerImages[cat.idname]} style={styles.bannerImg} />
              </View>

              <View style={styles.grid}>
                {cat.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    orderMode={orderMode}
                    onPress={(menuItem) => {
                      setSelectedItem(menuItem);
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: Theme.spacing.xxl }} />
        </ScrollView>
      </View>

      <ItemDetailSheet
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <CategoryDrawer
        visible={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        t={t}
        colors={colors}
      />

      {/* ── Order Mode Modal ── */}
      <Modal visible={showOrderModeModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalTopAccent, { backgroundColor: colors.primary }]} />

            <View style={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('orderMode.title')}</Text>

              <View style={styles.modeOptions}>
                <ModeOption
                  mode="pickup"
                  title={t('orderMode.pickup')}
                  selected={pendingMode === 'pickup'}
                  onPress={() => setPendingMode('pickup')}
                  colors={colors}
                />
                <ModeOption
                  mode="delivery"
                  title={t('orderMode.delivery')}
                  selected={pendingMode === 'delivery'}
                  onPress={() => {
                    if (!deliveryAvailable) return;
                    setPendingMode('delivery');
                  }}
                  colors={colors}
                  disabled={!deliveryAvailable}
                />
              </View>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmOrderMode}
                activeOpacity={0.88}
              >
                <SvgXml
                  xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`}
                  width={16}
                  height={16}
                />
                <Text style={styles.confirmBtnText}>{t('orderMode.confirm') ?? 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CartNudge colors={colors} />
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
  },
  logoImg: {
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: Theme.borderRadii.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: '#fff',
  },
  modeBtn: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },

  bannerWrap: {
    height: BANNER_HEIGHT,
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderRadius: Theme.borderRadii.xl,
    overflow: 'hidden',
    borderWidth: 0,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Theme.spacing.sm + 4,
    marginBottom: Theme.spacing.md,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  modalCard: {
    borderRadius: Theme.borderRadii.lg,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.lg,
  },
  modalTopAccent: {
    height: 6,
  },
  modalBody: {
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Theme.fontSizes.xxl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modeOptions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  confirmBtn: {
    marginTop: 4,
    width: '100%',
    height: 48,
    borderRadius: Theme.borderRadii.lg,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Theme.shadows.flame,
  },
  confirmBtnText: {
    fontSize: Theme.fontSizes.md,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
