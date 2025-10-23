import { API_BASE_URL } from "../../../shared/constants/api";
import { retrieveUMK } from "../../../shared/crypto/keyManagement";
import { getSodium } from "../../../shared/utils";
import type {
    CreateMessageRequest,
    EncryptedMessage,
    Message,
} from "../types/message";

export async function sendMessage(content: string): Promise<Message> {
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

    const encryptedContent = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        sodium.from_string(content),
        null,
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
            nonce: sodium.to_base64(nonce),
        } as CreateMessageRequest),
    });

    if (!response.ok) {
        throw new Error("Failed to send message");
    }

    return response.json();
}

export async function getMessages(): Promise<Message[]> {
    const umk = retrieveUMK();
    if (!umk) {
        throw new Error("User Master Key not found");
    }

    const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch messages");
    }

    // decrypt the messages using the UMK after fetching

    const messages: EncryptedMessage[] = await response.json();
    const sodium = await getSodium();

    return messages.map((message) => {
        const decryptedContent =
            sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
                null,
                sodium.from_base64(message.encrypted_content),
                null,
                sodium.from_base64(message.nonce),
                umk,
            );
        return {
            ...message,
            content: sodium.to_string(decryptedContent),
        };
    });
}
