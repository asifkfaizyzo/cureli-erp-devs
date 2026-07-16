// src/features/profile/api/members.api.ts

import { api } from '../../../services/api';
import type {
  FamilyMember,
  CreateMemberPayload,
  UpdateMemberPayload,
} from '../../../types/members';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const membersApi = {
  list: () =>
    api.get<ApiResponse<{ members: FamilyMember[] }>>('/mobile/users/members'),

  create: (payload: CreateMemberPayload) =>
    api.post<ApiResponse<{ member: FamilyMember }>>(
      '/mobile/users/members',
      payload,
    ),

  update: (id: string, payload: UpdateMemberPayload) =>
    api.patch<ApiResponse<{ member: FamilyMember }>>(
      `/mobile/users/members/${id}`,
      payload,
    ),

  delete: (id: string) =>
    api.delete<ApiResponse<Record<string, never>>>(
      `/mobile/users/members/${id}`,
    ),
};