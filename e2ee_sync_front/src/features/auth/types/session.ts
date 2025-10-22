export interface SessionInfo {
  user_id: string;
  username: string;
}

export interface RegisterRequest {
  username: string;
  wrapped_umk: string;
}

export interface RegisterResponse {
  user_id: string;
  username: string;
  device_id: string;
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
