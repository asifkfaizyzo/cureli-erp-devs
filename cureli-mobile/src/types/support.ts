export type CustomerTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type CustomerTicketCategory =
  | 'WRONG_ITEM'
  | 'DAMAGED_PRODUCT'
  | 'DELIVERY_ISSUE'
  | 'QUALITY_ISSUE'
  | 'MISSING_ITEM'
  | 'REFUND_REQUEST'
  | 'OTHER';

export type CustomerTicketActivityType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'CUSTOMER_REPLY'
  | 'CADMIN_REPLY'
  | 'INTERNAL_NOTE';

export interface CustomerTicketSummary {
  ticket_id: string;
  ticket_number: string;
  category: CustomerTicketCategory;
  subject: string;
  status: CustomerTicketStatus;
  order_id: string;
  order_number?: string;
  shop_name?: string;
  attachment_count: number;
  created_at: string;
  resolved_at?: string | null;
}

export interface CustomerTicketAttachment {
  attachment_id: string;
  storage_key: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  url?: string | null;
}

export interface CustomerTicketActivity {
  activity_id: string;
  type: CustomerTicketActivityType;
  from_status?: CustomerTicketStatus | null;
  to_status?: CustomerTicketStatus | null;
  actor_type: 'CUSTOMER' | 'CADMIN' | 'SYSTEM';
  actor_name: string;
  message?: string | null;
  created_at: string;
}

export interface CustomerTicketDetail {
  ticket_id: string;
  ticket_number: string;
  category: CustomerTicketCategory;
  other_category_text?: string | null;
  subject: string;
  description: string;
  status: CustomerTicketStatus;
  created_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  order: {
    order_id: string;
    order_number: string;
    total_amount: number;
    shop_name?: string;
    completed_at?: string;
    items: Array<{
      item_id: string;
      medicine_name_snapshot: string;
      quantity: number;
      unit_price_snapshot: number;
    }>;
  };
  attachments: CustomerTicketAttachment[]; // ◄ Fixed type name
  activities: CustomerTicketActivity[];
}

export interface SelectedTicketImage {
  uri: string;
  name: string;
  type: string;
}