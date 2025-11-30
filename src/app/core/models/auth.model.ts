import { OwnerProfile } from './owner.model';

export interface OwnerLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface OwnerRegisterRequest {
  companyName: string;
  email: string;
  password: string;
  primaryContactName: string;
  cityId: string;
  phoneNumber?: string;
  confirmPassword?: string;
}

export interface OwnerAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  owner: OwnerProfile;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OwnerAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  owner: OwnerProfile | null;
}

