import type { PassphraseRecoveryPayload } from "../../../shared/crypto/keyManagement";

export interface SessionInfo {
  user_id: string;
  username: string;
}

export interface RegisterRequest {
  wrapped_umk: string;
  recovery: PassphraseRecoveryPayload;
}

export interface RegisterResponse {
  user_id: string;
  username: string;
  device_id: string;
}

export interface RegisterInitRequest {
  username: string;
}

export interface RegisterInitResponse {
  user_id: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  device_id?: string;
}

export interface LoginResponse {
  user_id: string;
  username: string;
  device_id?: string;
  device_verified: boolean;
  requires_device_registration: boolean;
  recovery_available: boolean;
}
