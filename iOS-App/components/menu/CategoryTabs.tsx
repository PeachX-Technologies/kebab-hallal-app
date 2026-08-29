import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import Theme from '../../theme';
import MenuImage from './MenuImage';

interface Category {
  idname: string;
  items?: { image?: string }[];
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (category: string) => void;
  t: (key: string) => string;
  colors: typeof Theme.colors;
  isSticky: boolean;
  onOpenDrawer?: () => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  t,
  colors,
  isSticky,
  onOpenDrawer,
}: CategoryTabsProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tabPositions = useRef<Record<string, number>>({});
  const [canScrollRight, setCanScrollRight] = useState(false);

  const stickiness = useRef(new Animated.Value(isSticky ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(stickiness, {
      toValue: isSticky ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [isSticky, stickiness]);

  const overlayOpacity = useMemo(
    () => stickiness.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    [stickiness],
  );

  useEffect(() => {
    if (!activeCategory || !scrollRef.current) return;
    const x = tabPositions.current[activeCategory];
    if (x !== undefined) {
      scrollRef.current.scrollTo({
        x: Math.max(0, x - 100),
        animated: true,
      });
    }
  }, [activeCategory]);

  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setCanScrollRight(contentOffset.x + layoutMeasurement.width < contentSize.width - 4);
  }, []);

  const handleTabLayout = useCallback((idname: string, layoutX: number) => {
    tabPositions.current[idname] = layoutX;
  }, []);

  const chevronColor = isSticky ? 'rgba(255,255,255,0.7)' : colors.textSecondary;

  return (
    <View style={styles.wrapper}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background },
          { opacity: overlayOpacity },
        ]}
      />
      <View
        style={[
          styles.inner,
          !isSticky && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        ]}
      >
        {onOpenDrawer && (
          <TouchableOpacity
            style={[
              styles.drawerBtn,
              {
                backgroundColor: isSticky ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
              },
            ]}
            onPress={onOpenDrawer}
            activeOpacity={0.7}
          >
            <SvgXml
              xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="${chevronColor}"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>`}
              width={20}
              height={20}
            />
          </TouchableOpacity>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {categories.map((cat) => {
            const isActive = cat.idname === activeCategory;
            const catName = t(`menu.categories.${cat.idname}.name`);
            return (
              <TouchableOpacity
                key={cat.idname}
                style={[
                  styles.tab,
                  isSticky
                    ? isActive
                      ? { backgroundColor: 'rgba(255,255,255,0.3)' }
                      : { backgroundColor: 'rgba(255,255,255,0.15)' }
                    : isActive
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: 'rgba(0,0,0,0.06)' },
                ]}
                onPress={() => onSelect(cat.idname)}
                onLayout={(e) => handleTabLayout(cat.idname, e.nativeEvent.layout.x)}
                accessibilityLabel={cat.idname}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <View style={[styles.imageWrap, isActive && styles.imageWrapActive]}>
                  {cat.items?.[0]?.image ? (
                    <MenuImage
                      filename={cat.items[0].image}
                      style={styles.img}
                      resizeMode="cover"
                      fallback={<Text style={styles.emoji}>🥙</Text>}
                    />
                  ) : (
                    <Text style={styles.emoji}>🥙</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabText,
                    { color: isSticky ? (isActive ? '#fff' : 'rgba(255,255,255,0.85)') : (isActive ? '#fff' : colors.textSecondary) },
                    isActive && styles.tabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {catName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {canScrollRight && (
          <View
            style={[
              styles.fadeRight,
              { backgroundColor: isSticky ? colors.primary : colors.background },
            ]}
            pointerEvents="none"
          >
            <SvgXml
              xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="${chevronColor}"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>`}
              width={16}
              height={16}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerBtn: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadii.md,
  },
  imageWrap: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadii.sm,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  imageWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emoji: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  tabText: {
    fontSize: 12,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    lineHeight: 14,
  },
  tabTextActive: {
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
});
