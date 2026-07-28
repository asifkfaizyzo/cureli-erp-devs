// src/types/order.ts
// Updated: Added invoice_generated_at to MobileOrderDetail

export type MarketplaceOrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface MobileOrderItem {
  item_id:               string;
  medicine_name:         string;
  brand:                 string | null;
  pack_size:             string | null;
  quantity:              number;
  unit_price:            number;
  mrp:                   number;
  line_total:            number;
  requires_prescription: boolean;
  image_url:             string | null;
}

export interface MobileOrderPrescription {
  prescription_id: string;
  original_name:   string;
  mime_type:       string;
  sequence:        number;
  is_expired:      boolean;
}

export interface MobileOrderStatusHistory {
  from_status:     MarketplaceOrderStatus | null;
  to_status:       MarketplaceOrderStatus;
  changed_by_type: string;
  reason:          string | null;
  created_at:      string;
}

export interface MobileOrderSummary {
  order_id:              string;
  order_number:          string;
  status:                MarketplaceOrderStatus;
  shop_name:             string | null;
  total_amount:          number;
  requires_prescription: boolean;
  item_count:            number;
  items:                 MobileOrderItem[];
  notes:                 string | null;
  rejection_reason:      string | null;
  placed_at:             string;
  accepted_at:           string | null;
  ready_at:              string | null;
  completed_at:          string | null;
  rejected_at:           string | null;
  cancelled_at:          string | null;
}

export interface MobileOrderDeliveryAddress {
  label:           string;
  address_line_1:  string;
  address_line_2:  string | null;
  landmark:        string | null;
  city:            string;
  state:           string;
  pincode:         string;
  latitude:        number | null;
  longitude:       number | null;
  recipient_name:  string | null;
  recipient_phone: string | null;
}

export interface MobileOrderDetail {
  order_id:               string;
  order_number:           string;
  status:                 MarketplaceOrderStatus;
  shop_name:              string | null;
  branch_name:            string | null;
  delivery_address:       MobileOrderDeliveryAddress;

  total_amount:           number;
  subtotal:               number;
  service_charge?:        number | null;
  delivery_fee?:          number | null;
  km_surcharge?:          number | null;
  tip?:                   number | null;
  grand_total?:           number | null;

  requires_prescription:  boolean;
  payment_method:         string;
  notes:                  string | null;
  rejection_reason:       string | null;
  rejection_reason_other: string | null;
  placed_at:              string;
  accepted_at:            string | null;
  ready_at:               string | null;
  completed_at:           string | null;
  rejected_at:            string | null;
  cancelled_at:           string | null;
  items:                  MobileOrderItem[];
  prescriptions:          MobileOrderPrescription[];
  status_history:         MobileOrderStatusHistory[];

  // ── Invoice ───────────────────────────────────────────────
  // Set once the pharmacy confirms billing.
  // null means invoice not yet generated.
  invoice_generated_at?:  string | null;
}

export interface ReorderAvailableItem {
  variantId:            string;
  skuId:                string;
  name:                 string;
  manufacturer:         string | null;
  image:                string | null;
  pricePerUnit:         number;
  requiresPrescription: boolean;
  category:             string | null;
  quantity:             number;
  shopId:               string;
  shopName:             string;
  branchId:             string;
  branchName:           string;
  branchLatitude:       number | null;
  branchLongitude:      number | null;
}

export interface ReorderUnavailableItem {
  medicine_name: string;
  reason:        'not_listed' | 'out_of_stock' | 'no_price';
}

export interface ReorderItemsResponse {
  branch_id:   string;
  branch_name: string | null;
  shop_id:     string;
  shop_name:   string | null;
  available:   ReorderAvailableItem[];
  unavailable: ReorderUnavailableItem[];
}

export interface OrdersListMeta {
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}