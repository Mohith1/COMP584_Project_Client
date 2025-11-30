export interface PaginationRequest {
  page: number;
  size: number;
}

// API Response format (matches server)
export interface ApiPaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Client-side format (for backward compatibility)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export type Persona = 'owner' | 'user' | null;


