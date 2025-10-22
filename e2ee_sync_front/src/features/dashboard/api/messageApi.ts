import { API_BASE_URL } from "../../../shared/constants/api";
import type { CreateMessageRequest, Message } from "../types/message";

export async function sendMessage(content: string): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ content } as CreateMessageRequest),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

export async function getMessages(): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}
