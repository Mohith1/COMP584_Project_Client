import { OwnerProfile } from './owner.model';

export interface OwnerLoginRequest {
  email: string;
  password: string;
}

export interface OwnerRegisterRequest extends OwnerLoginRequest {
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber?: string;
}

export interface OwnerAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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

