import { API_BASE_URL } from "../../../shared/constants/api";
import { retrieveUMK } from "../../../shared/crypto/keyManagement";
import {
  type CachedMessageRecord,
  getCachedMessagesForUser,
  saveMessagesForUser,
} from "../../../shared/db/indexedDB";
import { getSodium } from "../../../shared/utils";
import { isActuallyOffline } from "../../../shared/utils/debugOffline";
import type { SessionInfo } from "../../auth/types/session";
import type {
  CreateMessageRequest,
  EncryptedMessage,
  Message,
  MessageFetchResult,
} from "../types/message";

export async function sendMessage(
  content: string,
  session: SessionInfo,
): Promise<Message> {
  const umk = retrieveUMK();
  if (!umk) {
    throw new Error("User Master Key not found");
  }

  // encrypt the message content using the UMK before sending
  // use XChaCha20-Poly1305 for encryption with sodium

  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  );

  const nonceBase64 = sodium.to_base64(nonce);

  const additionalData = sodium.from_string(session.user_id);

  const encryptedContent = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    sodium.from_string(content),
    additionalData,
    null,
    nonce,
    umk,
  );

  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      content: sodium.to_base64(encryptedContent),
      nonce: nonceBase64,
    } as CreateMessageRequest),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

export async function getMessages(
  session: SessionInfo,
): Promise<MessageFetchResult> {
  const isOffline = isActuallyOffline();

  if (isOffline) {
    const cachedMessages = await getCachedMessagesForUser(session.user_id);
    return {
      messages: mapCachedRecordsToMessages(cachedMessages),
      source: "cache",
    };
  }

  const umk = retrieveUMK();
  if (!umk) {
    const cachedMessages = await getCachedMessagesForUser(session.user_id);
    if (cachedMessages.length > 0) {
      return {
        messages: mapCachedRecordsToMessages(cachedMessages),
        source: "cache",
      };
    }
    throw new Error("User Master Key not found");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }

    const messages: EncryptedMessage[] = await response.json();
    const sodium = await getSodium();
    const additionalData = sodium.from_string(session.user_id);
    const cachedRecords: CachedMessageRecord[] = [];
    const decryptedMessages = messages.map((message) => {
      const decryptedContent =
        sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
          null,
          sodium.from_base64(message.encrypted_content),
          additionalData,
          sodium.from_base64(message.nonce),
          umk,
        );
      const content = sodium.to_string(decryptedContent);
      cachedRecords.push({
        id: message.id,
        userId: session.user_id,
        encryptedContent: message.encrypted_content,
        nonce: message.nonce,
        content,
        createdAt: message.created_at,
        cachedAt: Date.now(),
      });
      return {
        ...message,
        content,
      };
    });

    try {
      await saveMessagesForUser(session.user_id, cachedRecords);
    } catch (cacheError) {
      console.warn("Failed to cache messages offline:", cacheError);
    }

    return { messages: decryptedMessages, source: "network" };
  } catch (error) {
    console.error(
      "Failed to fetch messages from server, using cached data when available:",
      error,
    );
    const cachedMessages = await getCachedMessagesForUser(session.user_id);
    if (cachedMessages.length > 0) {
      return {
        messages: mapCachedRecordsToMessages(cachedMessages),
        source: "cache",
      };
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch messages");
  }
}

function mapCachedRecordsToMessages(records: CachedMessageRecord[]): Message[] {
  return records
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((record) => ({
      id: record.id,
      user_id: record.userId,
      content: record.content,
      created_at: record.createdAt,
    }));
}
