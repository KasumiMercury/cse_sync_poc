import { API_BASE_URL } from "../../../shared/constants/api";
import type { DebugInfo } from "../types/debug";

export async function getDebugInfo(): Promise<DebugInfo> {
  const response = await fetch(`${API_BASE_URL}/debug`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch debug info");
  }

  return response.json();
}
