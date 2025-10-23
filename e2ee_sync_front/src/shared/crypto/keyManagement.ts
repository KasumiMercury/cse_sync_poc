import { getSodium } from "../utils/sodium";

const textEncoder = new TextEncoder();

const LOCAL_KEK_KEY_PREFIX = "local-kek:";

export function buildLocalKEKKeyName(userId: string): string {
  return `${LOCAL_KEK_KEY_PREFIX}${userId}`;
}

export async function generateUMK(): Promise<Uint8Array> {
  const sodium = await getSodium();
  // Generate 32 random bytes for UMK
  return sodium.randombytes_buf(32);
}

export async function generateLocalKEK(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["wrapKey", "unwrapKey"],
  );

  return key;
}

export function buildUMKWrapAAD(userId: string): Uint8Array {
  return textEncoder.encode(userId);
}

export async function wrapUMK(
  umk: Uint8Array,
  localKEK: CryptoKey,
  aad: Uint8Array,
): Promise<string> {
  const umkKey = await crypto.subtle.importKey(
    "raw",
    umk,
    {
      name: "AES-GCM",
    },
    true, // extractable
    ["encrypt", "decrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const wrappedKey = await crypto.subtle.wrapKey("raw", umkKey, localKEK, {
    name: "AES-GCM",
    iv: iv,
    additionalData: aad,
  });

  const combined = new Uint8Array(iv.length + wrappedKey.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrappedKey), iv.length);

  return arrayBufferToBase64(combined);
}

export async function unwrapUMK(
  wrappedUMKBase64: string,
  localKEK: CryptoKey,
  aad: Uint8Array,
): Promise<Uint8Array> {
  const combined = base64ToArrayBuffer(wrappedUMKBase64);

  const iv = combined.slice(0, 12);
  const wrappedKey = combined.slice(12);

  const umkKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    localKEK,
    {
      name: "AES-GCM",
      iv: iv,
      additionalData: aad,
    },
    {
      name: "AES-GCM",
    },
    true, // extractable: true
    ["encrypt", "decrypt"],
  );

  const umkArrayBuffer = await crypto.subtle.exportKey("raw", umkKey);
  return new Uint8Array(umkArrayBuffer);
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// singleton pattern for UMK storage in memory
let storedUMK: Uint8Array | null = null;

export function storeUMK(umk: Uint8Array): void {
  storedUMK = umk;
}

export function retrieveUMK(): Uint8Array | null {
  return storedUMK;
}
