// src/features/prescription-request/api/prescriptionRequest.api.ts

import { api } from '../../../services/api';

export interface UploadedFile {
  file_key:      string;
  original_name: string;
  mime_type:     string;
  file_size:     number;
}

export interface SubmitRequestPayload {
  files:               UploadedFile[];
  delivery_address_id: string;
  search_latitude:     number;
  search_longitude:    number;
  branch_ids:          string[];
}

export interface QuoteItem {
  quote_item_id:    string;
  medicine_name:    string;
  brand:            string | null;
  pack_size:        string | null;
  // variant_sku is returned by formatQuoteItem on the backend
  // as the MasterMedicineVariant.sku_id value
  variant_sku:      string | null;
  unit_price:       number;
  mrp:              number;
  quantity:         number;
  line_total:       number;
  is_available:     boolean;
  is_substitute:    boolean;
  substitute_note:  string | null;
  image_url:        string | null;
}

export interface RecipientSummary {
  recipient_id:       string;
  shop_id:            string;
  branch_id:          string;
  shop_name:          string;
  branch_name:        string;
  distance_km:        number | null;
  status:             string;
  sent_at:            string;
  quote_sent_at:      string | null;
  quote_expires_at:   string | null;
  accepted_at:        string | null;
  declined_at:        string | null;
  expired_at:         string | null;
  decline_reason:     string | null;
  converted_order_id: string | null;
  quote_summary: {
    total_items:       number;
    available_items:   number;
    unavailable_items: number;
    quote_total:       number;
  } | null;
  quote_items: QuoteItem[];
}

export interface RequestDetail {
  request_id:       string;
  request_number:   string;
  status:           string;
  delivery_address: Record<string, unknown>;
  created_at:       string;
  expires_at:       string | null;
  cancelled_at:     string | null;
  completed_at:     string | null;
  files: {
    file_id:       string;
    original_name: string;
    mime_type:     string;
    file_size:     number;
    sequence:      number;
  }[];
  recipients: RecipientSummary[];
}

export const prescriptionRequestApi = {
  // Upload prescription images before submission
  uploadFiles: (formData: FormData) =>
    api.post('/mobile/prescription-requests/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Submit prescription request to selected pharmacies
  submitRequest: (data: SubmitRequestPayload) =>
    api.post('/mobile/prescription-requests', data),

  // List customer's requests
  getRequests: (params?: { page?: number; limit?: number }) =>
    api.get('/mobile/prescription-requests', { params }),

  // Request detail with all pharmacy responses
  getRequestDetail: (requestId: string) =>
    api.get(`/mobile/prescription-requests/${requestId}`),

  // Signed URL for a prescription image
  getFileUrl: (requestId: string, fileId: string) =>
    api.get(`/mobile/prescription-requests/${requestId}/files/${fileId}/url`),

  // Accept a pharmacy's quote
  acceptQuote: (requestId: string, recipientId: string) =>
    api.post(
      `/mobile/prescription-requests/${requestId}/recipients/${recipientId}/accept`,
    ),

  // Cancel the request
  cancelRequest: (requestId: string) =>
    api.post(`/mobile/prescription-requests/${requestId}/cancel`),
};