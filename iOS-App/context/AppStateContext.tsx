import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { subscribeShopStatus, ShopStatus } from '../services/storeService';

export type OrderMode = 'pickup' | 'delivery';

interface AppStateValue {
  orderMode: OrderMode;
  setOrderMode: (mode: OrderMode) => void;
  restaurantOpen: boolean;
  deliveryAvailable: boolean;
  isOnline: boolean;
  orderModeSelected: boolean;
  setOrderModeSelected: (selected: boolean) => void;
  checkingStatus: boolean;
}

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [orderMode, setOrderModeState] = useState<OrderMode>('pickup');
  const [orderModeSelected, setOrderModeSelectedState] = useState(false);
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ORDER_MODE).then((stored) => {
      if (stored === 'pickup' || stored === 'delivery') {
        setOrderModeState(stored);
        setOrderModeSelectedState(true);
      } else if (stored === 'takeaway') {
        setOrderModeState('pickup');
        setOrderModeSelectedState(true);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsub = subscribeShopStatus(
      (status?: ShopStatus) => {
        setRestaurantOpen(status?.status ?? true);
        setDeliveryAvailable(status?.deliverySystem ?? true);
        setCheckingStatus(false);
      },
      () => {
        setCheckingStatus(false);
      },
    );
    return unsub;
  }, []);

  const setOrderMode = useCallback(async (mode: OrderMode) => {
    const normalized = (mode as string) === 'takeaway' ? 'pickup' : mode;
    setOrderModeState(normalized);
    setOrderModeSelectedState(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ORDER_MODE, normalized);
    } catch {
    }
  }, []);

  const setOrderModeSelected = useCallback((selected: boolean) => {
    setOrderModeSelectedState(selected);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        orderMode,
        setOrderMode,
        restaurantOpen,
        deliveryAvailable,
        isOnline,
        orderModeSelected,
        setOrderModeSelected,
        checkingStatus,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export default AppStateContext;
