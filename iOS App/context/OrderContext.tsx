import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './CartContext';
import { OrderMode } from './AppStateContext';
import { generateOrderReference } from '../utils/orderUtils';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { showLocalOrderNotification } from '../services/notificationService';
import { useAuth } from './AuthContext';
import {
  saveOrder,
  getAndIncrementCounter,
  subscribeActiveOrders,
  fetchPastOrders,
  countPastOrders,
  OrderData,
} from '../services/orderService';

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface DeliveryAddress {
  house: string;
  street: string;
  city: string;
  lat?: number;
  lon?: number;
}

export interface Order {
  id: string;
  counter: number;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  orderMode: OrderMode;
  paymentMethod: 'cash' | 'card' | 'Stripe' | 'online';
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  deliveryAddress?: DeliveryAddress;
  deliveryNotes?: string;
  clientName: string;
  clientPhone: string;
  createdAt: number;
  updatedAt: number;
  deliveryTime: number;
  scheduledAt?: string;
}

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  pastOrders: Order[];
  pastLoading: boolean;
  pastHasMore: boolean;
  pastCount: number;
  pastCountLoading: boolean;
  loadPastOrders: () => Promise<void>;
  addOrder: (orderData: {
    orderMode: OrderMode;
    items: CartItem[];
    subtotal: number;
    totalAmount?: number;
    deliveryFee?: number;
    deliveryAddress?: {
      street: string;
      house: string;
      city: string;
    };
    deliveryNotes?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    paymentMethod: 'cash' | 'card' | 'Stripe' | 'online';
    clientName: string;
    clientPhone: string;
    scheduledAt?: string;
  }) => Promise<Order>;
}

const OrderContext = createContext<OrderState | undefined>(undefined);

function sanitizeItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item: any) => ({
    id: item.id ?? '',
    itemId: item.itemId ?? item.menuItemId ?? '',
    itemName: item.itemName ?? item.name ?? '',
    image: item.image ?? '',
    itemImage: item.itemImage ?? item.imageUrl ?? '',
    basePrice: item.basePrice ?? 0,
    baseDeliveryPrice: item.baseDeliveryPrice ?? item.basePrice ?? 0,
    selectedOptions: item.selectedOptions ?? {},
    quantity: item.quantity ?? 1,
    totalPrice: item.totalPrice ?? item.lineTotal ?? 0,
    totalDeliveryPrice: item.totalDeliveryPrice ?? item.totalPrice ?? 0,
    adPrice: item.adPrice ?? 0,
  }));
}

function orderDataToOrder(
  id: string,
  data: OrderData | undefined,
  items: CartItem[],
  subtotal: number,
  orderMode: OrderMode,
  paymentMethod: 'cash' | 'card' | 'Stripe' | 'online',
): Order {
  return {
    id,
    counter: data?.counter || 0,
    status: (data?.status as OrderStatus) || 'pending',
    items: data ? sanitizeItems(data.items) : items,
    subtotal: data?.totalAmount || subtotal,
    totalAmount: data?.totalAmount || subtotal,
    orderMode: ((data?.deliveryMethod as string) === 'takeaway' ? 'pickup' : data?.deliveryMethod as OrderMode) || orderMode,
    paymentMethod,
    paymentStatus: data?.paymentStatus,
    stripePaymentIntentId: data?.stripePaymentIntentId,
    deliveryAddress: data?.deliveryAddress
      ? {
          house: data.deliveryAddress.house || '',
          street: data.deliveryAddress.street || '',
          city: data.deliveryAddress.city || 'Catania',
          ...(data.deliveryAddress.lat != null && data.deliveryAddress.lon != null
            ? { lat: data.deliveryAddress.lat, lon: data.deliveryAddress.lon }
            : {}),
        }
      : undefined,
    deliveryNotes: data?.deliveryNotes || data?.additionalInfo || '',
    clientName: data?.clientName || '',
    clientPhone: data?.clientPhone || '',
    createdAt: data?.createdAt
      ? (typeof (data.createdAt as any).toDate === 'function'
          ? (data.createdAt as any).toDate().getTime()
          : new Date(data.createdAt).getTime())
      : Date.now(),
    updatedAt: data?.updatedAt
      ? (typeof (data.updatedAt as any).toDate === 'function'
          ? (data.updatedAt as any).toDate().getTime()
          : new Date(data.updatedAt).getTime())
      : Date.now(),
    deliveryTime: data?.deliveryTime ?? (orderMode === 'delivery' ? 30 : 15),
    scheduledAt: data?.scheduledAt || undefined,
  };
}

function sortOrdersDesc(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => b.createdAt - a.createdAt);
}

const ACTIVE_STATUSES = ['pending', 'preparing', 'delivering'];

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastHasMore, setPastHasMore] = useState(true);
  const [pastCount, setPastCount] = useState(0);
  const [pastCountLoading, setPastCountLoading] = useState(false);
  const pastLastDocRef = useRef<any>(null);
  const { firebaseUser } = useAuth();
  const unsubRef = useRef<(() => void) | null>(null);
  const notifiedSentinel = useRef<Set<string>>(new Set());
  const sentinelLoaded = useRef(false);
  const notifsEnabledRef = useRef(true);

  function persistSentinel() {
    AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFIED_STATUSES,
      JSON.stringify([...notifiedSentinel.current]),
    ).catch(() => {});
  }

  function mapOrders(firestoreOrders: { id: string; data: OrderData }[]): Order[] {
    return firestoreOrders.map((doc) =>
      orderDataToOrder(
        doc.id,
        doc.data,
        [],
        0,
        ((doc.data?.deliveryMethod as string) === 'takeaway' ? 'pickup' : doc.data?.deliveryMethod as OrderMode) || 'pickup',
        (doc.data?.paymentMethod as 'cash' | 'card' | 'Stripe' | 'online') || 'cash',
      ),
    );
  }

  const statusMessages: Record<string, (o: Order) => { title: string; body: string }> = {
    pending: (o) => ({
      title: 'Order Received',
      body: o.orderMode === 'delivery'
        ? 'Your order #' + o.counter + ' has been received! We will start preparing soon.'
        : 'Your pickup order #' + o.counter + ' has been received! We will start preparing soon.',
    }),
    preparing: (o) => ({
      title: 'Order Being Prepared',
      body: o.orderMode === 'delivery'
        ? 'Your order #' + o.counter + ' is being prepared!'
        : 'Your pickup order #' + o.counter + ' is being prepared!',
    }),
    delivering: (o) => ({
      title: o.orderMode === 'delivery' ? 'Order On Its Way' : 'Ready for pick up',
      body: o.orderMode === 'delivery'
        ? 'Your order #' + o.counter + ' is on its way!'
        : 'Your pickup order #' + o.counter + ' is almost ready!',
    }),
    delivered: (o) => ({
      title: o.orderMode === 'delivery' ? 'Order Delivered' : 'Ready for Pickup',
      body: o.orderMode === 'delivery'
        ? 'Your order #' + o.counter + ' has been delivered!'
        : 'Your pickup order #' + o.counter + ' is ready for pickup!',
    }),
    cancelled: (o) => ({
      title: 'Order Cancelled',
      body: o.orderMode === 'delivery'
        ? 'Your order #' + o.counter + ' has been cancelled.'
        : 'Your pickup order #' + o.counter + ' has been cancelled.',
    }),
  };

  function notifyStatusChanges(orders: Order[]) {
    for (const order of orders) {
      const sentinelKey = `${order.id}:${order.status}`;
      if (notifiedSentinel.current.has(sentinelKey)) continue;
      const build = statusMessages[order.status];
      if (build) {
        const msg = build(order);
        if (notifsEnabledRef.current) {
          showLocalOrderNotification(msg.title, msg.body, { orderId: order.id });
        }
      }
      notifiedSentinel.current.add(sentinelKey);
    }
    persistSentinel();
  }

  const loadPastOrders = useCallback(async () => {
    if (!firebaseUser || pastLoading || !pastHasMore) return;
    setPastLoading(true);
    try {
      const result = await fetchPastOrders(firebaseUser.uid, 20, pastLastDocRef.current);
      setPastOrders((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const newOrders = result.orders
          .map((doc) => mapOrders([doc])[0])
          .filter((o) => !existingIds.has(o.id));
        return sortOrdersDesc([...prev, ...newOrders]);
      });
      pastLastDocRef.current = result.lastDoc;
      setPastHasMore(result.orders.length >= 20);
      if (result.orders.length > 0) {
        countPastOrders(firebaseUser.uid).then((count) => {
          setPastCount(count);
        });
      }
    } catch (e) {
      console.warn('loadPastOrders error:', e);
    } finally {
      setPastLoading(false);
    }
  }, [firebaseUser, pastLoading, pastHasMore]);

  useEffect(() => {
    if (!firebaseUser) {
      setActiveOrders([]);
      setPastOrders([]);
      return;
    }

    // Load persisted data on mount
    const loadPersisted = Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFIED_STATUSES),
    ]);

    loadPersisted
      .then(([ordersJson, sentinelJson]) => {
        if (sentinelJson) {
          try {
            notifiedSentinel.current = new Set(JSON.parse(sentinelJson) as string[]);
          } catch { /* ignore corrupt data */ }
        }
        sentinelLoaded.current = true;

        if (ordersJson) {
          const allOrders = sortOrdersDesc(JSON.parse(ordersJson) as Order[]);
          const sanitized = allOrders.map((o) => ({ ...o, items: sanitizeItems(o.items) }));
          setActiveOrders(sanitized.filter((o) => ACTIVE_STATUSES.includes(o.status)));
          setPastOrders(sanitized.filter((o) => !ACTIVE_STATUSES.includes(o.status)));
        }
      })
      .catch(() => {});

    unsubRef.current = subscribeActiveOrders(
      firebaseUser.uid,
      (firestoreOrders) => {
        const mapped = mapOrders(firestoreOrders);
        const sorted = sortOrdersDesc(mapped);
        setActiveOrders(sorted);
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED).then((val) => {
          notifsEnabledRef.current = val !== 'false';
          notifyStatusChanges(sorted);
        });
      },
      (err) => {
        console.error('Active orders subscription error:', err);
      },
    );

    setPastCountLoading(true);
    countPastOrders(firebaseUser.uid).then((count) => {
      setPastCount(count);
      setPastCountLoading(false);
    });

    return () => {
      unsubRef.current?.();
    };
  }, [firebaseUser]);

  const orders = useMemo(() => sortOrdersDesc([...activeOrders, ...pastOrders]), [activeOrders, pastOrders]);

  const addOrder = useCallback(
    async (orderData: {
      orderMode: OrderMode;
      items: CartItem[];
      subtotal: number;
      totalAmount?: number;
      deliveryFee?: number;
      deliveryAddress?: {
        street: string;
        house: string;
        city: string;
      };
      deliveryNotes?: string;
      deliveryLat?: number;
      deliveryLng?: number;
      paymentMethod: 'cash' | 'card' | 'Stripe' | 'online';
      clientName: string;
      clientPhone: string;
      scheduledAt?: string;
    }): Promise<Order> => {
      let counter = 0;
      let firestoreId = '';

      if (firebaseUser) {
        counter = await getAndIncrementCounter();
        const orderPayload: OrderData = {
          clientName: orderData.clientName,
          clientPhone: orderData.clientPhone,
          userId: firebaseUser.uid,
          counter,
          status: 'pending',
          items: orderData.items.map((item) => ({
            id: item.itemId,
            itemId: item.itemId,
            itemName: item.itemName,
            image: item.image || '',
            itemImage: item.itemImage || item.image || '',
            basePrice: orderData.orderMode === 'delivery' ? 0 : item.basePrice,
            baseDeliveryPrice: item.baseDeliveryPrice || 0,
            selectedOptions: item.selectedOptions,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            totalDeliveryPrice: item.totalDeliveryPrice ?? item.totalPrice,
            adPrice: item.adPrice || 0,
          })),
          totalAmount: orderData.totalAmount || orderData.subtotal,
          deliveryFee: orderData.deliveryFee || 0,
          deliveryMethod: (orderData.orderMode as string) === 'takeaway' ? 'pickup' : orderData.orderMode as OrderMode,
          paymentMethod: orderData.paymentMethod === 'card' ? 'Stripe' : orderData.paymentMethod,
          paymentStatus: orderData.paymentMethod === 'cash' ? 'completed' : 'pending',
          deliveryNotes: orderData.deliveryNotes || '',
          additionalInfo: orderData.deliveryNotes || '',
          orderSource: 'mobile-app',
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryTime: orderData.orderMode === 'delivery' ? 30 : 15,
          ...(orderData.scheduledAt ? { scheduledAt: orderData.scheduledAt } : {}),
        };
        if (orderData.deliveryAddress) {
          orderPayload.deliveryAddress = {
            house: orderData.deliveryAddress.house,
            street: orderData.deliveryAddress.street,
            city: orderData.deliveryAddress.city,
            ...(orderData.deliveryLat != null && orderData.deliveryLng != null
              ? { lat: orderData.deliveryLat, lon: orderData.deliveryLng }
              : {}),
          };
        }
        firestoreId = await saveOrder(orderPayload);
      } else {
        counter = Date.now() % 10000;
      }

      const newOrder: Order = {
        id: firestoreId || generateOrderReference(),
        counter,
        status: 'pending',
        items: orderData.items,
        subtotal: orderData.subtotal,
        totalAmount: orderData.totalAmount || orderData.subtotal,
        orderMode: (orderData.orderMode as string) === 'takeaway' ? 'pickup' : orderData.orderMode,
        paymentMethod: (orderData.paymentMethod === 'card' ? 'Stripe' : orderData.paymentMethod) as 'cash' | 'card' | 'Stripe' | 'online',
        paymentStatus: orderData.paymentMethod === 'cash' ? 'completed' : 'pending',
        ...(orderData.deliveryNotes ? { deliveryNotes: orderData.deliveryNotes } : {}),
        clientName: orderData.clientName,
        clientPhone: orderData.clientPhone,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deliveryTime: orderData.orderMode === 'delivery' ? 30 : 15,
        ...(orderData.scheduledAt ? { scheduledAt: orderData.scheduledAt } : {}),
      };
      if (orderData.deliveryAddress) {
        newOrder.deliveryAddress = {
          house: orderData.deliveryAddress.house,
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          ...(orderData.deliveryLat != null && orderData.deliveryLng != null
            ? { lat: orderData.deliveryLat, lon: orderData.deliveryLng }
            : {}),
        };
      }
      if (!firebaseUser) {
        setActiveOrders((prev) => {
          const updated = [newOrder, ...prev];
          AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([...updated, ...pastOrders])).catch(() => {});
          return updated;
        });
      }
      return newOrder;
    },
    [firebaseUser, pastOrders],
  );

  return (
    <OrderContext.Provider value={{ orders, activeOrders, pastOrders, pastLoading, pastHasMore, pastCount, pastCountLoading, loadPastOrders, addOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders(): OrderState {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}

export default OrderContext;
