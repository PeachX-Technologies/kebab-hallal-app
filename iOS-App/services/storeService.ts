import { db } from '../utils/firestore';

export interface ShopStatus {
  status: boolean;
  deliverySystem: boolean;
}

export interface DeliveryZones {
  zone1: boolean;
  zone2: boolean;
  zone3: boolean;
}

export interface MinZoneCost {
  zone1: number;
  zone2: number;
  zone3: number;
}

const DEFAULT_SHOP_STATUS: ShopStatus = {
  status: true,
  deliverySystem: true,
};

const DEFAULT_DELIVERY_ZONES: DeliveryZones = {
  zone1: false,
  zone2: false,
  zone3: false,
};

const DEFAULT_MIN_ZONE_COST: MinZoneCost = {
  zone1: 0,
  zone2: 0,
  zone3: 0,
};

function readSnapshotData(snap: any): Record<string, any> | null {
  if (!snap?.exists) return null;
  const data = snap.data?.();
  return data && typeof data === 'object' ? data : null;
}

function toShopStatus(data: Record<string, any> | null): ShopStatus {
  if (!data) return DEFAULT_SHOP_STATUS;
  return {
    status: data.status ?? DEFAULT_SHOP_STATUS.status,
    deliverySystem: data.deliverySystem ?? DEFAULT_SHOP_STATUS.deliverySystem,
  };
}

function toDeliveryZones(data: Record<string, any> | null): DeliveryZones {
  if (!data) return DEFAULT_DELIVERY_ZONES;
  return {
    zone1: !!data.zone1,
    zone2: !!data.zone2,
    zone3: !!data.zone3,
  };
}

function toMinZoneCost(data: Record<string, any> | null): MinZoneCost {
  if (!data) return DEFAULT_MIN_ZONE_COST;
  return {
    zone1: data.zone1 ?? DEFAULT_MIN_ZONE_COST.zone1,
    zone2: data.zone2 ?? DEFAULT_MIN_ZONE_COST.zone2,
    zone3: data.zone3 ?? DEFAULT_MIN_ZONE_COST.zone3,
  };
}

export async function fetchShopStatus(): Promise<ShopStatus | null> {
  try {
    const snap = await db.collection('management').doc('shop-status').get();
    const data = readSnapshotData(snap);
    return data ? toShopStatus(data) : null;
  } catch (e) {
    console.warn('fetchShopStatus error:', e);
    return null;
  }
}

export function subscribeShopStatus(
  onChange: (status: ShopStatus) => void,
  onError?: (err: any) => void,
) {
  return db.collection('management').doc('shop-status').onSnapshot(
    (snap: any) => {
      onChange(toShopStatus(readSnapshotData(snap)));
    },
    (err: any) => {
      console.warn('subscribeShopStatus error:', err);
      onError?.(err);
    },
  );
}

export async function fetchDeliveryZones(): Promise<DeliveryZones> {
  try {
    const snap = await db.collection('management').doc('delivery-zones').get();
    return toDeliveryZones(readSnapshotData(snap));
  } catch (e) {
    console.warn('fetchDeliveryZones error:', e);
    return DEFAULT_DELIVERY_ZONES;
  }
}

export function subscribeDeliveryZones(
  onChange: (zones: DeliveryZones) => void,
  onError?: (err: any) => void,
) {
  return db.collection('management').doc('delivery-zones').onSnapshot(
    (snap: any) => {
      onChange(toDeliveryZones(readSnapshotData(snap)));
    },
    (err: any) => {
      console.warn('subscribeDeliveryZones error:', err);
      onError?.(err);
    },
  );
}

export async function fetchMinZoneCost(): Promise<MinZoneCost> {
  try {
    const snap = await db.collection('management').doc('min-zone-cost').get();
    return toMinZoneCost(readSnapshotData(snap));
  } catch (e) {
    console.warn('fetchMinZoneCost error:', e);
    return DEFAULT_MIN_ZONE_COST;
  }
}

export async function fetchBlockedItems(): Promise<string[]> {
  try {
    const snap = await db.collection('management').doc('blocked-items').get();
    const data = readSnapshotData(snap);
    return Array.isArray(data?.items) ? data.items : [];
  } catch (e) {
    console.warn('fetchBlockedItems error:', e);
    return [];
  }
}
