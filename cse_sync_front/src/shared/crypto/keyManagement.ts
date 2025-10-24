import { getSodium } from "../utils/sodium";

const textEncoder = new TextEncoder();

const LOCAL_KEK_KEY_PREFIX = "local-kek:";
const UMK_BYTE_LENGTH = 32;
const AES_GCM_ALGORITHM = "AES-GCM";
const AES_GCM_IV_LENGTH = 12;

const PASSPHRASE_SALT_LENGTH = 16;
const PASSPHRASE_ITERATIONS = 310000;
const PASSPHRASE_KEY_LENGTH = 256;
const PASSPHRASE_HASH = "SHA-256";

export interface PassphraseRecoveryPayload {
  wrapped_umk: string;
  salt: string;
  iv: string;
}

let storedUMK: Uint8Array | null = null;

export function buildLocalKEKKeyName(userId: string): string {
  return `${LOCAL_KEK_KEY_PREFIX}${userId}`;
}

export async function generateUMK(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.randombytes_buf(UMK_BYTE_LENGTH);
}

export async function generateLocalKEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: AES_GCM_ALGORITHM,
      length: PASSPHRASE_KEY_LENGTH,
    },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

export function buildUMKWrapAAD(userId: string): Uint8Array {
  return textEncoder.encode(userId);
}

export async function wrapUMK(
  umk: Uint8Array,
  localKEK: CryptoKey,
  aad: Uint8Array,
): Promise<string> {
  const umkKey = await importAesKey(umk, true);
  const iv = randomBytes(AES_GCM_IV_LENGTH);

  const wrappedKey = await crypto.subtle.wrapKey("raw", umkKey, localKEK, {
    name: AES_GCM_ALGORITHM,
    iv,
    additionalData: aad,
  });

  return bytesToBase64(concatBytes(iv, new Uint8Array(wrappedKey)));
}

export async function unwrapUMK(
  wrappedUMKBase64: string,
  localKEK: CryptoKey,
  aad: Uint8Array,
): Promise<Uint8Array> {
  const combined = base64ToBytes(wrappedUMKBase64);
  const iv = combined.slice(0, AES_GCM_IV_LENGTH);
  const wrappedKey = combined.slice(AES_GCM_IV_LENGTH);

  const umkKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    localKEK,
    {
      name: AES_GCM_ALGORITHM,
      iv,
      additionalData: aad,
    },
    {
      name: AES_GCM_ALGORITHM,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const umkArrayBuffer = await crypto.subtle.exportKey("raw", umkKey);
  return new Uint8Array(umkArrayBuffer);
}

export function storeUMK(umk: Uint8Array): void {
  storedUMK = umk;
}

export function retrieveUMK(): Uint8Array | null {
  return storedUMK;
}

export function clearStoredUMK(): void {
  storedUMK = null;
  console.log("Stored UMK cleared from memory");
}

export async function createPassphraseRecoveryPayload(
  passphrase: string,
  umk: Uint8Array,
): Promise<PassphraseRecoveryPayload> {
  const salt = randomBytes(PASSPHRASE_SALT_LENGTH);
  const iv = randomBytes(AES_GCM_IV_LENGTH);

  const passphraseKey = await derivePassphraseKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv,
    },
    passphraseKey,
    umk,
  );

  return {
    wrapped_umk: bytesToBase64(new Uint8Array(encrypted)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
  };
}

export async function recoverUMKWithPassphrase(
  passphrase: string,
  payload: PassphraseRecoveryPayload,
): Promise<Uint8Array> {
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const encrypted = base64ToBytes(payload.wrapped_umk);

  const passphraseKey = await derivePassphraseKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv,
    },
    passphraseKey,
    encrypted,
  );

  return new Uint8Array(decrypted);
}

async function importAesKey(
  keyMaterial: Uint8Array,
  extractable: boolean,
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: AES_GCM_ALGORITHM },
    extractable,
    ["encrypt", "decrypt"],
  );
}

async function derivePassphraseKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    {
      name: "PBKDF2",
    },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSPHRASE_ITERATIONS,
      hash: PASSPHRASE_HASH,
    },
    baseKey,
    {
      name: AES_GCM_ALGORITHM,
      length: PASSPHRASE_KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function concatBytes(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, current) => acc + current.length, 0);
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const buffer of buffers) {
    combined.set(buffer, offset);
    offset += buffer.length;
  }

  return combined;
}

function bytesToBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}
