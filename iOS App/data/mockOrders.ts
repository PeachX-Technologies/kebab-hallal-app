import { OrderMode } from '../context/AppStateContext';
import { CartItem } from '../context/CartContext';

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface DeliveryAddress {
  house: string;
  street: string;
  city: string;
}

export interface MockOrder {
  id: string;
  counter: number;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  orderMode: OrderMode;
  paymentMethod: 'cash' | 'card';
  deliveryAddress?: DeliveryAddress;
  deliveryNotes?: string;
  clientName: string;
  clientPhone: string;
  createdAt: number;
  updatedAt: number;
  deliveryTime: number;
}

const now = Date.now();
const MIN = 60 * 1000;

export const mockOrders: MockOrder[] = [
  {
    id: 'KH-20250608-1A2B',
    counter: 42,
    status: 'preparing',
    items: [
      {
        id: 'cart-1', itemId: 'KB01', itemName: 'Piadina Kebab', image: '',
        basePrice: 5.00, baseDeliveryPrice: 5.00,
        selectedOptions: {
          Q11: { name: 'Medio', price: 0 },
          Q02: [{ name: 'Salsa bianca', price: 0 }, { name: 'Salsa piccante', price: 0 }],
          Q03: [{ name: 'Lattuga', price: 0 }, { name: 'Pomodori', price: 0 }],
          Q05: { name: 'Cipolla', price: 0 },
          Q06: { name: 'Piccante', price: 0 },
        },
        quantity: 2, totalPrice: 10.00, totalDeliveryPrice: 10.00, adPrice: 0,
      },
      {
        id: 'cart-2', itemId: 'BV08', itemName: 'Coca Cola 33cl', image: '',
        basePrice: 2.00, baseDeliveryPrice: 2.00, selectedOptions: {},
        quantity: 2, totalPrice: 4.00, totalDeliveryPrice: 4.00, adPrice: 0,
      },
    ],
    subtotal: 14.00, totalAmount: 15.00,
    orderMode: 'delivery', paymentMethod: 'card',
    deliveryAddress: { house: '12', street: 'Via Etnea', city: 'Catania' },
    deliveryNotes: 'Citofonare al 3° piano',
    clientName: 'Mario Rossi', clientPhone: '+39 333 1234567',
    createdAt: now - 12 * MIN, updatedAt: now - 10 * MIN, deliveryTime: 20,
  },
  {
    id: 'KH-20250608-3C4D',
    counter: 41,
    status: 'pending',
    items: [
      {
        id: 'cart-3', itemId: 'MC01', itemName: 'Menù Completo', image: '',
        basePrice: 8.00, baseDeliveryPrice: 8.00,
        selectedOptions: {
          Q11: { name: 'Grande', price: 0 },
          Q02: [{ name: 'Salsa curry', price: 0 }, { name: 'Maionese', price: 0 }],
          Q03: [{ name: 'Cipolla', price: 0 }, { name: 'Peperoni', price: 0 }],
          Q01: { name: 'Coca Cola 33cl', price: 0 },
          Q05: { name: 'Cipolla', price: 0 },
          Q06: { name: 'No piccante', price: 0 },
          Q07: { name: 'Con Piadina', price: 0 },
        },
        quantity: 1, totalPrice: 8.00, totalDeliveryPrice: 8.00, adPrice: 0,
      },
      {
        id: 'cart-4', itemId: 'AN01', itemName: 'Vaschetta di Patatine', image: '',
        basePrice: 3.50, baseDeliveryPrice: 3.50,
        selectedOptions: {
          Q02: [{ name: 'Salsa bianca', price: 0 }],
        },
        quantity: 1, totalPrice: 3.50, totalDeliveryPrice: 3.50, adPrice: 0,
      },
    ],
    subtotal: 11.50, totalAmount: 11.50,
    orderMode: 'pickup', paymentMethod: 'cash',
    clientName: 'Mario Rossi', clientPhone: '+39 333 1234567',
    createdAt: now - 5 * MIN, updatedAt: now - 5 * MIN, deliveryTime: 15,
  },
  {
    id: 'KH-20250607-5E6F',
    counter: 40,
    status: 'delivered',
    items: [
      {
        id: 'cart-5', itemId: 'KB07', itemName: 'Piatto Kebab', image: '',
        basePrice: 7.00, baseDeliveryPrice: 7.00,
        selectedOptions: {
          Q12: { name: 'Grande', price: 0 },
          Q02: [{ name: 'Salsa greca', price: 0 }, { name: 'Salsa BBQ', price: 0 }],
          Q03: [{ name: 'Lattuga mista', price: 0 }, { name: 'Radicchio', price: 0 }],
          Q05: { name: 'Cipolla', price: 0 },
          Q06: { name: 'Piccante', price: 0 },
        },
        quantity: 1, totalPrice: 7.00, totalDeliveryPrice: 7.00, adPrice: 0,
      },
    ],
    subtotal: 7.00, totalAmount: 8.00,
    orderMode: 'delivery', paymentMethod: 'card',
    deliveryAddress: { house: '5', street: 'Via Roma', city: 'Catania' },
    clientName: 'Mario Rossi', clientPhone: '+39 333 1234567',
    createdAt: now - 1440 * MIN, updatedAt: now - 1430 * MIN, deliveryTime: 25,
  },
  {
    id: 'KH-20250605-7G8H',
    counter: 39,
    status: 'cancelled',
    items: [
      {
        id: 'cart-6', itemId: 'VG01', itemName: 'Piadina Falafel', image: '',
        basePrice: 5.50, baseDeliveryPrice: 5.50,
        selectedOptions: {
          Q15: { name: 'Medio', price: 0 },
          Q02: [{ name: 'Salsa cilly', price: 0 }],
          Q03: [{ name: 'Pomodori', price: 0 }, { name: 'Verza', price: 0 }],
        },
        quantity: 1, totalPrice: 5.50, totalDeliveryPrice: 5.50, adPrice: 0,
      },
    ],
    subtotal: 5.50, totalAmount: 5.50,
    orderMode: 'pickup', paymentMethod: 'cash',
    clientName: 'Mario Rossi', clientPhone: '+39 333 1234567',
    createdAt: now - 2880 * MIN, updatedAt: now - 2870 * MIN, deliveryTime: 15,
  },
  {
    id: 'KH-20250603-9I0J',
    counter: 38,
    status: 'delivered',
    items: [
      {
        id: 'cart-7', itemId: 'BU01', itemName: 'Chicken burger', image: '',
        basePrice: 6.00, baseDeliveryPrice: 6.00,
        selectedOptions: {
          Q02: [{ name: 'Maionese', price: 0 }, { name: 'Ketchup', price: 0 }],
          Q03: [{ name: 'Lattuga', price: 0 }, { name: 'Cipolla', price: 0 }],
          Q05: { name: 'Cipolla', price: 0 },
          Q06: { name: 'No piccante', price: 0 },
        },
        quantity: 2, totalPrice: 12.00, totalDeliveryPrice: 12.00, adPrice: 0,
      },
      {
        id: 'cart-8', itemId: 'AN04', itemName: 'Alette Di Pollo', image: '',
        basePrice: 4.50, baseDeliveryPrice: 4.50,
        selectedOptions: {
          Q02: [{ name: 'Salsa BBQ', price: 0 }],
        },
        quantity: 1, totalPrice: 4.50, totalDeliveryPrice: 4.50, adPrice: 0,
      },
    ],
    subtotal: 16.50, totalAmount: 18.00,
    orderMode: 'delivery', paymentMethod: 'card',
    deliveryAddress: { house: '8', street: 'Corso Italia', city: 'Catania' },
    deliveryNotes: 'Lasciare al portiere',
    clientName: 'Mario Rossi', clientPhone: '+39 333 1234567',
    createdAt: now - 4320 * MIN, updatedAt: now - 4300 * MIN, deliveryTime: 30,
  },
];
