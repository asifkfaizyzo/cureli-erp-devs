import { api } from '../../../services/api';

export const ordersApi = {
  // --- Orders ---
  placeOrder: (data: {
    branch_id: string;
    delivery_address_id: string;
    items: { variantId: string; quantity: number }[];
    notes?: string;
    prescription_files?: {
      prescription_key: string;
      original_name: string;
      mime_type: string;
      file_size: number;
    }[];
  }) => api.post('/mobile/orders', data),

  getOrders: (params?: { page?: number; limit?: number }) =>
    api.get('/mobile/orders', { params }),

  getOrderDetail: (orderId: string) => 
    api.get(`/mobile/orders/${orderId}`),

  cancelOrder: (orderId: string) => 
    api.post(`/mobile/orders/${orderId}/cancel`),

  // --- Prescriptions ---
  uploadPrescriptions: (formData: FormData) =>
    api.post('/mobile/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getPrescriptionUrl: (orderId: string, prescriptionId: string) =>
    api.get(`/mobile/orders/${orderId}/prescriptions/${prescriptionId}/url`),
};