import { API_BASE_URL } from "../../../shared/constants/api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SessionInfo,
} from "../types/session";

export async function register(username: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username } as RegisterRequest),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Username already exists");
    }
    throw new Error("Registration failed");
  }

  return response.json();
}

export async function login(username: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username } as LoginRequest),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export async function getSession(): Promise<SessionInfo> {
  const response = await fetch(`${API_BASE_URL}/session`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Session not found");
  }

  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}
