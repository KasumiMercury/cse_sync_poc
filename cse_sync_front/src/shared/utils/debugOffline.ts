const DEBUG_OFFLINE_KEY = "debug-offline-mode";

/**
 * Enable or disable debug offline mode
 * @param value - true to simulate offline, false to disable simulation
 */
export function setDebugOffline(value: boolean): void {
  if (value) {
    localStorage.setItem(DEBUG_OFFLINE_KEY, "true");
  } else {
    localStorage.removeItem(DEBUG_OFFLINE_KEY);
  }
}

/**
 * Check if debug offline mode is enabled
 * @returns true if debug offline mode is active
 */
export function isDebugOffline(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  return localStorage.getItem(DEBUG_OFFLINE_KEY) === "true";
}

/**
 * Check if the app should behave as offline
 * Combines real offline status with debug offline flag
 * @returns true if browser is offline OR debug offline is enabled
 */
export function isActuallyOffline(): boolean {
  const browserOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;
  const debugOffline = isDebugOffline();
  return browserOffline || debugOffline;
}
