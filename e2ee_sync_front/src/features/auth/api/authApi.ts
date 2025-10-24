import { API_BASE_URL } from "../../../shared/constants/api";
import type { DeviceInfo } from "../types/device";
import type {
  LoginRequest,
  LoginResponse,
  RegisterInitRequest,
  RegisterInitResponse,
  RegisterRequest,
  RegisterResponse,
  SessionInfo,
} from "../types/session";

export async function registerInit(
  username: string,
): Promise<RegisterInitResponse> {
  const response = await fetch(`${API_BASE_URL}/register/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username } as RegisterInitRequest),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Username already exists");
    }
    throw new Error("Failed to initialize registration");
  }

  return response.json();
}

export async function registerFinalize(
  wrappedUMK: string,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ wrapped_umk: wrappedUMK } as RegisterRequest),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Username already exists");
    }
    if (response.status === 401) {
      throw new Error("Registration session expired. Please start over.");
    }
    if (response.status === 404) {
      throw new Error("Registration session not found. Please start over.");
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

export async function getDevice(deviceId: string): Promise<DeviceInfo> {
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Device not found");
    }
    if (response.status === 403) {
      throw new Error("Device does not belong to this session");
    }
    throw new Error("Failed to fetch device info");
  }

  return response.json();
}
