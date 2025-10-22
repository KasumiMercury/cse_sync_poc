export interface DebugUser {
  id: string;
  username: string;
}

export interface DebugSession {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface DebugInfo {
  users: DebugUser[];
  sessions: DebugSession[];
}
