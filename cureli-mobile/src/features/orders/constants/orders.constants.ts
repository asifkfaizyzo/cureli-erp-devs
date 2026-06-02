// src/features/orders/constants/orders.constants.ts

import type { DispensedOrder } from '../../../types/order';

export const MOCK_ORDERS: DispensedOrder[] = [
  {
    id: 'ORD-2024-001',
    status: 'delivered',
    arrivedInMinutes: 9,
    deliveredAt: '2024-01-13T10:08:00.000Z',
    placedAt: '2024-01-13T09:59:00.000Z',
    ratingSubmitted: true,
    ratingValue: 4,
    paymentMethod: 'UPI',
    addressLine: 'Flat 4B, Prestige Towers, Kakkanad, Kochi 682030',
    items: [
      {
        id: 'item-001',
        name: 'Dolo 650mg Tablet',
        brand: 'Micro Labs',
        packSize: '15 Tablets',
        image: null,
        quantity: 2,
        unitPrice: 30,
        totalPrice: 60,
      },
      {
        id: 'item-002',
        name: 'Cetirizine 10mg',
        brand: 'Sun Pharma',
        packSize: '10 Tablets',
        image: null,
        quantity: 1,
        unitPrice: 45,
        totalPrice: 45,
      },
    ],
    bill: {
      mrp: 130,
      discount: 13,
      itemTotal: 105,
      handlingFee: 5,
      deliveryFee: 0,
      billTotal: 110,
    },
  },
  {
    id: 'ORD-2024-002',
    status: 'delivered',
    arrivedInMinutes: 14,
    deliveredAt: '2024-01-10T15:22:00.000Z',
    placedAt: '2024-01-10T15:08:00.000Z',
    ratingSubmitted: false,
    ratingValue: null,
    paymentMethod: 'Cash on Delivery',
    addressLine: 'Flat 4B, Prestige Towers, Kakkanad, Kochi 682030',
    items: [
      {
        id: 'item-003',
        name: 'Pantoprazole 40mg',
        brand: 'Alkem',
        packSize: '10 Tablets',
        image: null,
        quantity: 1,
        unitPrice: 85,
        totalPrice: 85,
      },
    ],
    bill: {
      mrp: 95,
      discount: 10,
      itemTotal: 85,
      handlingFee: 5,
      deliveryFee: 20,
      billTotal: 110,
    },
  },
  {
    id: 'ORD-2024-003',
    status: 'delivered',
    arrivedInMinutes: 7,
    deliveredAt: '2024-01-05T08:45:00.000Z',
    placedAt: '2024-01-05T08:38:00.000Z',
    ratingSubmitted: true,
    ratingValue: 5,
    paymentMethod: 'Card',
    addressLine: 'Flat 4B, Prestige Towers, Kakkanad, Kochi 682030',
    items: [
      {
        id: 'item-004',
        name: 'Vitamin D3 60K',
        brand: 'Cipla',
        packSize: '4 Capsules',
        image: null,
        quantity: 1,
        unitPrice: 120,
        totalPrice: 120,
      },
      {
        id: 'item-005',
        name: 'Omega 3 Fish Oil',
        brand: 'HealthVit',
        packSize: '30 Softgels',
        image: null,
        quantity: 1,
        unitPrice: 299,
        totalPrice: 299,
      },
    ],
    bill: {
      mrp: 450,
      discount: 45,
      itemTotal: 405,
      handlingFee: 5,
      deliveryFee: 0,
      billTotal: 410,
    },
  },
];

export function formatDeliveryDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}