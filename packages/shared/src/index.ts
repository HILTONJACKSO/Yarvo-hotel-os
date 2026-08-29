/**
 * @bellacasa/shared
 * Shared types and utilities for Bella Casa HMS
 */

// API response envelope types
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: PaginationMeta;
  requestId: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  details?: unknown;
  requestId: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Currency types
export type CurrencyCode = 'USD' | 'LRD' | string;

export interface Money {
  amount: string; // Use string to preserve decimal precision
  currency: CurrencyCode;
}

// Health check types
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  database: {
    status: 'ok' | 'down';
    message: string;
  };
}
