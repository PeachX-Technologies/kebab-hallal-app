import { ORDER_REFERENCE_PREFIX } from '../constants';

/**
 * Generates an order reference number in the format KH-YYYYMMDD-XXXX
 * where XXXX is a 4-character random hex string.
 * e.g. "KH-20250526-A3F2"
 */
export function generateOrderReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `${ORDER_REFERENCE_PREFIX}-${dateStr}-${hex}`;
}
