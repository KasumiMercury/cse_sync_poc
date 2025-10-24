export interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface EncryptedMessage {
  id: string;
  user_id: string;
  encrypted_content: string;
  nonce: string;
  created_at: string;
}

export interface CreateMessageRequest {
  content: string;
  nonce: string;
}
