export interface DebugUser {
  id: string;
  username: string;
  recovery_wrapped_umk?: string;
  recovery_salt?: string;
  recovery_iv?: string;
}

export interface DebugSession {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface DebugDevice {
  id: string;
  user_id: string;
  wrapped_umk: string;
  created_at: string;
}

export interface DebugMessage {
  id: string;
  user_id: string;
  encrypted_content: string;
  nonce: string;
  created_at: string;
}

export interface DebugInfo {
  users: DebugUser[];
  sessions: DebugSession[];
  devices: DebugDevice[];
  messages: DebugMessage[];
}
