export interface SessionInfo {
  user_id: string;
  username: string;
}

export interface RegisterRequest {
  username: string;
}

export interface RegisterResponse {
  user_id: string;
  username: string;
}

export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  user_id: string;
  username: string;
}
