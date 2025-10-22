const DEVICE_ID_KEY = "e2ee_device_id";

export function saveDeviceId(deviceId: string): void {
  try {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch (error) {
    console.error("Failed to save device ID to LocalStorage:", error);
    throw new Error("Failed to save device ID");
  }
}

export function getDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error("Failed to get device ID from LocalStorage:", error);
    return null;
  }
}

export function hasDeviceId(): boolean {
  return getDeviceId() !== null;
}

export function clearDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error("Failed to clear device ID from LocalStorage:", error);
  }
}
