import { OrderMode } from '../context/AppStateContext';
import { MenuItem } from '../context/MenuContext';
import { CartItem } from '../context/CartContext';

/**
 * Returns the correct price for a menu item based on the active order mode.
 * Property 1: price = item.price for takeaway, item.deliveryprice for delivery.
 */
export function getItemPrice(item: MenuItem, orderMode: OrderMode): number {
  return orderMode === 'delivery' ? item.deliveryprice : item.price;
}

/**
 * Calculates the line total for a cart item.
 * Property 2: lineTotal = (basePrice + sum(optionPrices)) * quantity
 */
export function calculateLineTotal(
  basePrice: number,
  selectedOptions: Record<string, any>,
  quantity: number,
): number {
  let optionsTotal = 0;
  for (const value of Object.values(selectedOptions)) {
    if (Array.isArray(value)) {
      optionsTotal += value.reduce((sum: number, o: any) => sum + (o.price ?? 0), 0);
    } else if (value?.price) {
      optionsTotal += value.price;
    }
  }
  return (basePrice + optionsTotal) * quantity;
}

/**
 * Calculates the cart subtotal as the sum of all line totals.
 * Property 3: subtotal = sum of all CartItem.lineTotal values
 */
export function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
}

/**
 * Formats a price number as a Euro string, e.g. "€4.50"
 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null || isNaN(price)) return '€0.00';
  return `€${price.toFixed(2)}`;
}

/**
 * Formats an extra option price as "+€0.20" or empty string if zero.
 */
export function formatExtraPrice(price: number): string {
  if (price <= 0) return '';
  return `+€${price.toFixed(2)}`;
}

/** Sum of option prices from a selectedOptions object (per-unit, not multiplied by qty). */
export function calcAdPrice(selectedOptions: Record<string, any>): number {
  let total = 0;
  for (const value of Object.values(selectedOptions)) {
    if (Array.isArray(value)) {
      total += value.reduce((s: number, o: any) => s + (o.price ?? 0), 0);
    } else if (value?.price) {
      total += value.price;
    }
  }
  return total;
}
