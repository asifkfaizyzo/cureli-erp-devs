// src/types/common.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data:    T;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total:       number;
    page:        number;
    limit:       number;
    total_pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code?:   string;
}