// src/types/members.ts

import type { UserSex } from './auth';

export interface FamilyMember {
  id: string;
  name: string;
  date_of_birth: string;  // "YYYY-MM-DD"
  age: number;            // computed by backend
  sex: UserSex;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberPayload {
  name: string;
  date_of_birth: string;
  sex: UserSex;
  phone?: string | null;
}

export interface UpdateMemberPayload {
  name?: string;
  date_of_birth?: string;
  sex?: UserSex;
  phone?: string | null;
}