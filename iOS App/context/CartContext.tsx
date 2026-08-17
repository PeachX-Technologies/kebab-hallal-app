import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderMode } from './AppStateContext';
import { MenuItem, NormalizedOption } from './MenuContext';
import { calculateLineTotal, calculateSubtotal, getItemPrice, calcAdPrice } from '../utils/priceUtils';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getMenuImageUrl } from '../lib/menuImageUrls';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemCustomization = Record<string, string | string[]>;

export interface CartItem {
  id: string;
  itemId: string;
  itemName: string;
  image: string;
  itemImage?: string;
  basePrice: number;
  baseDeliveryPrice: number;
  selectedOptions: Record<string, any>;
  quantity: number;
  totalPrice: number;
  totalDeliveryPrice: number;
  adPrice: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

interface CartContextValue extends CartState {
  addItem: (
    menuItem: MenuItem,
    customization: ItemCustomization,
    selectedOptions: NormalizedOption[],
    quantity: number,
    orderMode: OrderMode,
  ) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  recalculatePrices: (menuItems: Record<string, MenuItem>, orderMode: OrderMode) => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'UPDATE_QUANTITY'; id: string; quantity: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] }
  | { type: 'RECALCULATE'; menuItems: Record<string, MenuItem>; orderMode: OrderMode };

function computeDerived(items: CartItem[]): CartState {
  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: calculateSubtotal(items),
  };
}

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItems = [...state.items, action.item];
      return computeDerived(newItems);
    }
    case 'UPDATE_QUANTITY': {
      const newItems =
        action.quantity <= 0
          ? state.items.filter((i) => i.id !== action.id)
          : state.items.map((i) => {
              const newTotal = calculateLineTotal(i.basePrice, i.selectedOptions, action.quantity);
              return i.id === action.id
                ? { ...i, quantity: action.quantity, totalPrice: newTotal, totalDeliveryPrice: newTotal }
                : i;
            });
      return computeDerived(newItems);
    }
    case 'REMOVE_ITEM': {
      return computeDerived(state.items.filter((i) => i.id !== action.id));
    }
    case 'CLEAR_CART': {
      return computeDerived([]);
    }
    case 'LOAD_CART': {
      return computeDerived(action.items);
    }
    case 'RECALCULATE': {
      const newItems = state.items.map((item) => {
        const menuItem = action.menuItems[item.itemId];
        if (!menuItem) return item;
        const newBase = getItemPrice(menuItem, action.orderMode);
        const newTotalPrice = calculateLineTotal(newBase, item.selectedOptions, item.quantity);
        return {
          ...item,
          basePrice: newBase,
          baseDeliveryPrice: newBase,
          totalPrice: newTotalPrice,
          totalDeliveryPrice: newTotalPrice,
          adPrice: calcAdPrice(item.selectedOptions),
        };
      });
      return computeDerived(newItems);
    }
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | undefined>(undefined);

let cartIdCounter = 0;
function generateCartId(): string {
  return `cart-${Date.now()}-${++cartIdCounter}`;
}

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    itemCount: 0,
    subtotal: 0,
  });

  // Load persisted cart on mount (clear if older than 12 hours)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.CART).then((raw) => {
      if (!raw) return;
      try {
        const { items: savedItems, lastUpdated } = JSON.parse(raw);
        const age = Date.now() - lastUpdated;
        if (age < TWELVE_HOURS_MS && Array.isArray(savedItems)) {
          dispatch({ type: 'LOAD_CART', items: savedItems });
        }
      } catch {
        // corrupted data – ignore
      }
    });
  }, []);

  // Persist cart state whenever items change
  useEffect(() => {
    const payload = JSON.stringify({ items: state.items, lastUpdated: Date.now() });
    AsyncStorage.setItem(STORAGE_KEYS.CART, payload);
  }, [state.items]);

  const addItem = useCallback(
    (
      menuItem: MenuItem,
      customization: ItemCustomization,
      selectedOptionsArr: NormalizedOption[],
      quantity: number,
      orderMode: OrderMode,
    ) => {
      const basePrice = getItemPrice(menuItem, orderMode);
      const selectedOptions: Record<string, any> = {};
      for (const [questionId, value] of Object.entries(customization)) {
        if (!value) continue;
        const names = Array.isArray(value) ? value : [value];
        const matched = names
          .map((name) => selectedOptionsArr.find((o) => o.name === name))
          .filter(Boolean) as NormalizedOption[];
        selectedOptions[questionId] = Array.isArray(value) ? matched : (matched[0] || { name: value as string, price: 0 });
      }
      const adPrice = calcAdPrice(selectedOptions);
      const totalPrice = calculateLineTotal(basePrice, selectedOptions, quantity);
      const item: CartItem = {
        id: generateCartId(),
        itemId: menuItem.id,
        itemName: menuItem.name,
        image: menuItem.image,
        itemImage: getMenuImageUrl(menuItem.image),
        basePrice,
        baseDeliveryPrice: basePrice,
        selectedOptions,
        quantity,
        totalPrice,
        totalDeliveryPrice: totalPrice,
        adPrice,
      };
      dispatch({ type: 'ADD_ITEM', item });
    },
    [],
  );

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', id: cartItemId, quantity });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', id: cartItemId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const recalculatePrices = useCallback(
    (menuItems: Record<string, MenuItem>, orderMode: OrderMode) => {
      dispatch({ type: 'RECALCULATE', menuItems, orderMode });
    },
    [],
  );

  return (
    <CartContext.Provider
      value={{ ...state, addItem, updateQuantity, removeItem, clearCart, recalculatePrices }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default CartContext;
