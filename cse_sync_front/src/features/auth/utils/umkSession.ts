import {
  buildLocalKEKKeyName,
  buildUMKWrapAAD,
  retrieveUMK,
  storeUMK,
  unwrapUMK,
} from "../../../shared/crypto/keyManagement";
import { getKey } from "../../../shared/db/indexedDB";
import { getDeviceId } from "../../../shared/storage/deviceStorage";
import { getDevice } from "../api/authApi";
import type { SessionInfo } from "../types/session";

export async function ensureUMKForSession(session: SessionInfo): Promise<void> {
  if (retrieveUMK()) {
    console.log("UMK already in memory, skipping restoration");
    return;
  }

  const deviceId = getDeviceId();
  if (!deviceId) {
    throw new Error("Device ID missing locally. Please log in again.");
  }
  console.log("Device ID retrieved from LocalStorage:", deviceId);

  const keyName = buildLocalKEKKeyName(session.user_id);
  const localKEK = await getKey(keyName);

  if (!localKEK) {
    throw new Error("Local KEK not found. Please re-register this device.");
  }
  console.log("Local KEK retrieved from IndexedDB");

  const device = await getDevice(deviceId);
  console.log("Device info retrieved from server for device:", deviceId);

  if (device.user_id !== session.user_id) {
    throw new Error("Stored device does not match the active session.");
  }
  console.log("Device user_id matches session user_id");

  const wrapAAD = buildUMKWrapAAD(session.user_id);
  const umk = await unwrapUMK(device.wrapped_umk, localKEK, wrapAAD);
  console.log("UMK unwrapped successfully:", umk.length, "bytes");

  storeUMK(umk);
  console.log("UMK restored to memory for active session");
}
