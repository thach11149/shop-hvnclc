import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  shopId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type EventSource =
  | 'buyer_web'
  | 'seller_center'
  | 'admin_console'
  | 'mobile_app'
  | 'system_job'
  | 'import_file'
  | 'external_api'
  | 'ai_service';
