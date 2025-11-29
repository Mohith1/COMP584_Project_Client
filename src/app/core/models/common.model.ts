export interface PaginationRequest {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export type Persona = 'owner' | 'user' | null;

