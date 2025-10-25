import {
  buildLocalKEKKeyName,
  buildUMKWrapAAD,
  retrieveUMK,
  storeUMK,
  unwrapUMK,
} from "../../../shared/crypto/keyManagement";
import {
  cacheDeviceWrap,
  getCachedDeviceWrap,
  getKey,
} from "../../../shared/db/indexedDB";
import { getDeviceId } from "../../../shared/storage/deviceStorage";
import { getDevice } from "../api/authApi";
import type { SessionInfo } from "../types/session";

interface EnsureOptions {
  offlineFallback?: boolean;
}

export async function ensureUMKForSession(
  session: SessionInfo,
  options: EnsureOptions = {},
): Promise<void> {
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

  const wrapAAD = buildUMKWrapAAD(session.user_id);
  let wrappedUMK: string | null = null;
  const shouldPreferCache =
    options.offlineFallback &&
    typeof navigator !== "undefined" &&
    navigator.onLine === false;

  if (shouldPreferCache) {
    const cachedWrap = await getCachedDeviceWrap(deviceId);
    if (!cachedWrap) {
      throw new Error("Cached device wrap not available for offline restore.");
    }

    if (cachedWrap.userId !== session.user_id) {
      throw new Error("Cached device does not match the active session.");
    }

    wrappedUMK = cachedWrap.wrappedUmk;
    console.log("Using cached device wrap for offline UMK restore");
  } else {
    try {
      const latestDevice = await getDevice(deviceId);
      console.log("Device info retrieved from server for device:", deviceId);

      if (latestDevice.user_id !== session.user_id) {
        throw new Error("Stored device does not match the active session.");
      }
      console.log("Device user_id matches session user_id");

      wrappedUMK = latestDevice.wrapped_umk;
      await cacheDeviceWrap({
        deviceId,
        userId: session.user_id,
        wrappedUmk: wrappedUMK,
        cachedAt: Date.now(),
      });
      console.log("Device wrap refreshed from server and cached");
    } catch (error) {
      if (!options.offlineFallback) {
        throw error;
      }

      const cachedWrap = await getCachedDeviceWrap(deviceId);
      if (!cachedWrap) {
        throw error;
      }

      if (cachedWrap.userId !== session.user_id) {
        throw new Error("Cached device does not match the active session.");
      }

      wrappedUMK = cachedWrap.wrappedUmk;
      console.log("Using cached device wrap for offline UMK restore after network failure");
    }
  }

  if (!wrappedUMK) {
    throw new Error("Unable to retrieve wrapped UMK for active session.");
  }

  const umk = await unwrapUMK(wrappedUMK, localKEK, wrapAAD);
  console.log("UMK unwrapped successfully:", umk.length, "bytes");

  storeUMK(umk);
  console.log("UMK restored to memory for active session");
}
