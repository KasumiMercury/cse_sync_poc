export interface SessionInfo {
  user_id: string;
  username: string;
}

export interface RegisterRequest {
  wrapped_umk: string;
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
}

export interface LoginResponse {
  user_id: string;
  username: string;
  device_id: string;
  wrapped_umk: string;
}
