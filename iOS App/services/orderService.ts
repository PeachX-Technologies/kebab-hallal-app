import { db } from '../utils/firestore';
import { CartItem } from '../context/CartContext';
import { OrderMode } from '../context/AppStateContext';

export interface OrderData {
  clientName: string;
  clientPhone: string;
  userId: string;
  counter: number;
  status: string;
  items: CartItem[];
  totalAmount: number;
  deliveryFee?: number;
  deliveryMethod: OrderMode;
  paymentMethod: string;
  paymentStatus?: string;
  additionalInfo?: string;
  deliveryAddress?: {
    house?: string;
    street?: string;
    city?: string;
    lon?: number;
    lat?: number;
  };
  deliveryNotes?: string;
  orderSource?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryTime?: number;
  scheduledAt?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

export async function getAndIncrementCounter(): Promise<number> {
  const docRef = db.collection('management').doc('counter');
  try {
    return await db.runTransaction(async (transaction: any) => {
      const snap = await transaction.get(docRef);
      let count = 1;
      if (snap.exists) {
        count = (snap.data().count ?? 0) + 1;
      }
      transaction.set(docRef, { count }, { merge: true });
      return count;
    });
  } catch (e) {
    console.warn('getAndIncrementCounter error, using fallback:', e);
    return Date.now() % 100000;
  }
}

export async function saveOrder(orderData: OrderData): Promise<string> {
  const docRef = await db.collection('orders').add(orderData);
  return docRef.id;
}

export async function createTempOrder(
  orderData: Partial<OrderData>,
): Promise<string> {
  const docRef = await db.collection('temp_orders').add({
    ...orderData,
    createdAt: new Date(),
    status: 'pending',
  });
  return docRef.id;
}

export async function getUserOrders(
  userId: string,
): Promise<{ id: string; data: OrderData }[]> {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      data: doc.data() as OrderData,
    }));
  } catch (e) {
    console.warn('getUserOrders error:', e);
    return [];
  }
}

export function subscribeActiveOrders(
  userId: string,
  onChange: (orders: { id: string; data: OrderData }[]) => void,
  onError?: (err: any) => void,
) {
  const activeStatuses = ['pending', 'preparing', 'delivering'];

  const runListener = (useIndex: boolean) =>
    useIndex
      ? db
          .collection('orders')
          .where('userId', '==', userId)
          .where('status', 'in', activeStatuses)
          .onSnapshot(
            (snapshot: any) => {
              onChange(snapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() as OrderData })));
            },
            () => {
              fallbackUnsub.current = runListener(false);
            },
          )
      : db
          .collection('orders')
          .where('userId', '==', userId)
          .onSnapshot(
            (snapshot: any) => {
              onChange(snapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() as OrderData })));
            },
            (err: any) => {
              console.warn('Active orders subscription (fallback) error:', err);
              onError?.(err);
            },
          );

  const fallbackUnsub = { current: null as (() => void) | null };
  const primaryUnsub = runListener(true);

  return () => {
    primaryUnsub();
    fallbackUnsub.current?.();
  };
}

export async function fetchPastOrders(
  userId: string,
  pageSize = 20,
  lastVisible?: any,
): Promise<{ orders: { id: string; data: OrderData }[]; lastDoc: any }> {
  const pastStatuses = ['delivered', 'cancelled'];
  try {
    let query: any = db
      .collection('orders')
      .where('userId', '==', userId)
      .where('status', 'in', pastStatuses)
      .orderBy('createdAt', 'desc')
      .limit(pageSize);

    if (lastVisible) {
      query = query.startAfter(lastVisible);
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      data: doc.data() as OrderData,
    }));
    return { orders, lastDoc: snapshot.docs[snapshot.docs.length - 1] || null };
  } catch (e) {
    console.warn('fetchPastOrders error, trying unindexed fallback:', e);
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .where('status', 'in', pastStatuses)
      .get();
    const orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      data: doc.data() as OrderData,
    }));
    return { orders, lastDoc: null };
  }
}

export function subscribeUserOrders(
  userId: string,
  onChange: (orders: { id: string; data: OrderData }[]) => void,
  onError?: (err: any) => void,
) {
  return db
    .collection('orders')
    .where('userId', '==', userId)
    .onSnapshot(
      (snapshot: any) => {
        onChange(snapshot.docs.map((doc: any) => ({ id: doc.id, data: doc.data() as OrderData })));
      },
      (err: any) => {
        console.warn('subscribeUserOrders error:', err);
        onError?.(err);
      },
    );
}

export function subscribeOrder(
  orderId: string,
  onChange: (data: OrderData | null) => void,
  onError?: (err: any) => void,
) {
  return db
    .collection('orders')
    .doc(orderId)
    .onSnapshot(
      (snap: any) => {
        if (snap?.exists) {
          const data = snap.data?.();
          onChange(data ?? null);
        } else {
          onChange(null);
        }
      },
      (err: any) => {
        console.warn('subscribeOrder error:', err);
        onError?.(err);
      },
    );
}

export async function getMinZoneCosts(): Promise<Record<string, number>> {
  try {
    const snap = await db.collection('management').doc('min-zone-cost').get();
    if (snap.exists) {
      return snap.data() as Record<string, number>;
    }
    return {};
  } catch (error) {
    console.error('Error fetching min zone cost:', error);
    return {};
  }
}

export async function countPastOrders(userId: string): Promise<number> {
  try {
    const query = db
      .collection('orders')
      .where('userId', '==', userId)
      .where('status', 'in', ['delivered', 'cancelled']);
    const snapshot = await query.count().get();
    return snapshot.data().count;
  } catch (e) {
    console.warn('countPastOrders error:', e);
    return 0;
  }
}

export async function hasCompletedOrders(userId: string): Promise<boolean> {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.some((doc: any) => {
      const data = doc.data();
      return data && (data.status === 'completed' || data.paymentStatus === 'completed');
    });
  } catch (e) {
    console.warn('hasCompletedOrders error:', e);
    return false;
  }
}

export async function countUserDeliveryOrders(
  userId: string,
): Promise<number> {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .where('deliveryMethod', '==', 'delivery')
      .get();
    return snapshot.size;
  } catch (e) {
    console.warn('countUserDeliveryOrders error:', e);
    return 0;
  }
}
