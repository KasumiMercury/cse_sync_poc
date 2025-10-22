export interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CreateMessageRequest {
  content: string;
}
