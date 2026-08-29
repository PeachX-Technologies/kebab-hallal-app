export const STORAGE_KEYS = {
  USER: '@kh:user',
  ONBOARDING_DONE: '@kh:onboarding_done',
  LOCALE: '@kh:locale',
  ORDER_MODE: '@kh:order_mode',
  ORDERS: '@kh:orders',
  PROFILE_ADDRESS: '@kh:profile_address',
  PROFILE_PHONE: '@kh:profile_phone',
  PROFILE_HOUSE: '@kh:profile_house',
  PROFILE_CITY: '@kh:profile_city',
  PROFILE_LAT: '@kh:profile_lat',
  PROFILE_LNG: '@kh:profile_lng',
  NOTIFICATIONS_ENABLED: '@kh:notifications_enabled',
  CART: '@kh:cart',
  PENDING_PAYMENT_INTENT_ID: '@kh:pending_payment_intent_id',
  NOTIFIED_STATUSES: '@kh:notified_statuses',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
