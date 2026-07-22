import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import OrderCard from '../../components/order/OrderCard';
import EmptyState from '../../components/ui/EmptyState';
import { Order } from '../../context/OrderContext';
import Theme from '../../theme';

const LiveDot = ({ colors, color }: { colors: typeof Theme.colors; color?: string }) => (
  <View style={dot.wrap}>
    <View style={dot.outer} />
    <View style={[dot.inner, { backgroundColor: color ?? colors.primary }]} />
  </View>
);

const dot = StyleSheet.create({
  wrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  outer: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(249,18,26,0.2)',
  },
  inner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

const HistorySvg = ({ color }: { color: string }) => (
  <SvgXml
    xml={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="${color}"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`}
    width={14}
    height={14}
  />
);

type Tab = 'active' | 'past';

export default function OrdersScreen() {
  const { t, locale } = useLocale();
  const { firebaseUser } = useAuth();
  const { activeOrders, pastOrders, pastLoading, pastHasMore, pastCount, loadPastOrders } = useOrders();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<Tab>('active');

  useEffect(() => {
    if (selectedTab === 'past' && pastOrders.length === 0 && pastHasMore) {
      loadPastOrders();
    }
  }, [selectedTab]);

  const activeSorted = [...activeOrders].sort((a, b) => b.createdAt - a.createdAt);
  const pastSorted = [...pastOrders].sort((a, b) => b.createdAt - a.createdAt);

  function renderOrder({ item }: { item: Order }) {
    return (
      <OrderCard
        order={item}
        locale={locale}
        isCurrent
      />
    );
  }

  function renderPastOrder({ item }: { item: Order }) {
    return (
      <OrderCard
        order={item}
        locale={locale}
        isCurrent={false}
      />
    );
  }

  function onEndReached() {
    if (selectedTab === 'past' && pastHasMore && !pastLoading) {
      loadPastOrders();
    }
  }

  if (!firebaseUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ paddingTop: insets.top + Theme.spacing.sm }}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t('orders.title')}</Text>
            </View>
          </View>
          <View style={[styles.headerAccent, { backgroundColor: colors.primary }]} />
        </View>
        <EmptyState
          emoji="📋"
          message={t('orders.empty')}
          subtitle={t('orders.emptySubtitle')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ paddingTop: insets.top + Theme.spacing.sm }}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('orders.title')}</Text>
            {activeSorted.length > 0 && (
              <View style={[styles.livePill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <LiveDot colors={colors} />
                <Text style={[styles.livePillText, { color: colors.primary }]}>{activeSorted.length} {t('orderTracker.live')}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.headerAccent, { backgroundColor: colors.primary }]} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, selectedTab === 'active' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setSelectedTab('active')}
          activeOpacity={0.7}
        >
          <LiveDot colors={colors} color={selectedTab === 'active' ? colors.textInverse : colors.primary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'active' && { color: colors.textInverse }]}>
            {t('orders.currentOrder')}
          </Text>
          <View style={[styles.tabCount, { backgroundColor: colors.surface, borderColor: colors.border }, selectedTab === 'active' && { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={[styles.tabCountText, { color: colors.textSecondary }, selectedTab === 'active' && { color: colors.textInverse }]}>
              {activeSorted.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, selectedTab === 'past' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setSelectedTab('past')}
          activeOpacity={0.7}
        >
          <HistorySvg color={selectedTab === 'past' ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'past' && { color: colors.textInverse }]}>
            {t('orders.pastOrders')}
          </Text>
          <View style={[styles.tabCount, { backgroundColor: colors.surface, borderColor: colors.border }, selectedTab === 'past' && { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={[styles.tabCountText, { color: colors.textSecondary }, selectedTab === 'past' && { color: colors.textInverse }]}>
              {pastCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {selectedTab === 'active' ? (
        activeSorted.length === 0 ? (
          <View style={styles.tabContent}>
            <EmptyState
              emoji="📋"
              message={t('orders.empty')}
              subtitle={t('orders.emptySubtitle')}
            />
          </View>
        ) : (
          <FlatList
            data={activeSorted}
            keyExtractor={(item) => item.id}
            renderItem={renderOrder}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          />
        )
      ) : (
        pastSorted.length === 0 && !pastLoading ? (
          <View style={styles.tabContent}>
            <EmptyState
              emoji="📋"
              message={t('orders.empty')}
              subtitle={t('orders.emptySubtitle')}
            />
          </View>
        ) : (
          <FlatList
            data={pastSorted}
            keyExtractor={(item) => item.id}
            renderItem={renderPastOrder}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              pastLoading ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.fontSizes.xl,
    fontWeight: Theme.fontWeights.extraBold,
    fontFamily: Theme.fontFamily.extraBold,
    letterSpacing: -0.3,
  },
  headerAccent: {
    height: 3,
    width: 60,
    borderTopRightRadius: Theme.borderRadii.full,
    borderBottomRightRadius: Theme.borderRadii.full,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
  },
  livePillText: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
  },
  tabText: {
    fontSize: Theme.fontSizes.xs,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.borderRadii.full,
    borderWidth: 1,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: Theme.fontWeights.bold,
    fontFamily: Theme.fontFamily.bold,
  },

  tabContent: {
    flex: 1,
  },

  listContent: {
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.xxl,
  },

  loadingFooter: {
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
  },
});
