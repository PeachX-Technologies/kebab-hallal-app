import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Theme from '../../theme';

const TAB_ICONS = {
  home: (c: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  cart: (c: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  orders: (c: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>`,
  settings: (c: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.51 1 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

function TabBarIcon({ name, focused, colors }: { name: keyof typeof TAB_ICONS; focused: boolean; colors: typeof Theme.colors }) {
  const color = focused ? colors.tabBarActive : colors.tabBarInactive;
  return (
    <View style={[styles.iconBox, focused && { backgroundColor: colors.primary + '12' }]}>
      <SvgXml xml={TAB_ICONS[name](color)} width={24} height={24} />
    </View>
  );
}

function CartTabBarIcon({ focused, colors }: { focused: boolean; colors: typeof Theme.colors }) {
  const { itemCount } = useCart();
  const color = focused ? colors.tabBarActive : colors.tabBarInactive;
  return (
    <View style={[styles.iconBox, focused && { backgroundColor: colors.primary + '12' }]}>
      <View>
        <SvgXml xml={TAB_ICONS.cart(color)} width={24} height={24} />
        {itemCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
              {itemCount > 99 ? '99+' : String(itemCount)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 64 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom + 8, 14),
          paddingTop: 8,
          paddingHorizontal: Math.max(16, insets.left + 8),
          ...Theme.shadows.sm,
          elevation: 8,
          shadowOpacity: 0.08,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: Theme.fontWeights.semiBold,
          fontFamily: Theme.fontFamily.semiBold,
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} colors={colors} />,
          tabBarAccessibilityLabel: t('nav.home'),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('nav.cart'),
          tabBarIcon: ({ focused }) => <CartTabBarIcon focused={focused} colors={colors} />,
          tabBarAccessibilityLabel: t('nav.cart'),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('nav.orders'),
          tabBarIcon: ({ focused }) => <TabBarIcon name="orders" focused={focused} colors={colors} />,
          tabBarAccessibilityLabel: t('nav.orders'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} colors={colors} />,
          tabBarAccessibilityLabel: t('nav.settings'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 44,
    height: 34,
    borderRadius: Theme.borderRadii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    borderRadius: Theme.borderRadii.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

});
