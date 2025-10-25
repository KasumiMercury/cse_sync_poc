import type { SessionInfo } from "../../features/auth/types/session";

const SESSION_KEY = "cse_cached_session";

export function saveSessionInfo(session: SessionInfo): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to persist session info:", error);
  }
}

export function getCachedSessionInfo(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SessionInfo;
  } catch (error) {
    console.error("Failed to restore cached session info:", error);
    return null;
  }
}

export function clearCachedSessionInfo(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear cached session info:", error);
  }
}
