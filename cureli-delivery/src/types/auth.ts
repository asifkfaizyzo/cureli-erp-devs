// src/types/auth.ts
export type RiderStatus =
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'REJECTED';

export type RiderDocumentType =
  | 'PROFILE_PHOTO'
  | 'AADHAAR_FRONT'
  | 'AADHAAR_BACK'
  | 'PAN_FRONT'
  | 'DRIVING_LICENSE_FRONT'
  | 'DRIVING_LICENSE_BACK'
  | 'VEHICLE_RC';

export type RiderDocumentStatus =
  | 'NOT_UPLOADED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface RiderDocument {
  type:             RiderDocumentType;
  status:           RiderDocumentStatus;
  document_id:      string | null;
  rejection_reason: string | null;
  uploaded_at:      string | null;
}

export interface RiderZone {
  zone_id: string;
  name:    string;
  city:    string;
  state:   string;
}

export interface RiderProfile {
  rider_id:            string;
  phone:               string;
  full_name:           string | null;
  date_of_birth:       string | null;
  sex:                 'MALE' | 'FEMALE' | 'OTHER' | null;
  profile_photo_key:   string | null;
  status:              RiderStatus;
  suspension_reason:   string | null;
  zone:                RiderZone | null;
  is_online:           boolean;
  rating:              number;
  total_deliveries:    number;
  vehicle_type:        string | null;
  vehicle_number:      string | null;
  vehicle_make_model:  string | null;
  bank_holder_name:    string | null;
  bank_account_last4:  string | null;
  bank_verified:       boolean;
  referral_code:       string | null;
  created_at:          string;
  last_seen_at:        string | null;
  documents:           RiderDocument[];
  has_personal_details: boolean;
  has_vehicle_details:  boolean;
  has_bank_details:     boolean;
  has_all_documents:    boolean;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export interface VerifyOtpResponse extends AuthTokens {
  rider: RiderProfile;
}