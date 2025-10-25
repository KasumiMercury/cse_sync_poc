const DB_NAME = "CSESyncDB";
const DB_VERSION = 2;
const KEY_STORE_NAME = "keys";
const MESSAGE_STORE_NAME = "messages";
const MESSAGE_INDEX_BY_USER = "by_user";
const DEVICE_STORE_NAME = "deviceWraps";

export interface CachedMessageRecord {
  id: string;
  userId: string;
  encryptedContent: string;
  nonce: string;
  content: string;
  createdAt: string;
  cachedAt: number;
}

export interface CachedDeviceWrapRecord {
  deviceId: string;
  userId: string;
  wrappedUmk: string;
  cachedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }

      if (!db.objectStoreNames.contains(MESSAGE_STORE_NAME)) {
        const messageStore = db.createObjectStore(MESSAGE_STORE_NAME, {
          keyPath: "id",
        });
        messageStore.createIndex(MESSAGE_INDEX_BY_USER, "userId", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(DEVICE_STORE_NAME)) {
        db.createObjectStore(DEVICE_STORE_NAME, { keyPath: "deviceId" });
      }
    };
  });
}

export async function storeKey(keyName: string, key: CryptoKey): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEY_STORE_NAME], "readwrite");
    const store = transaction.objectStore(KEY_STORE_NAME);
    const request = store.put(key, keyName);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to store key: ${keyName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function getKey(keyName: string): Promise<CryptoKey | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEY_STORE_NAME], "readonly");
    const store = transaction.objectStore(KEY_STORE_NAME);
    const request = store.get(keyName);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to retrieve key: ${keyName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function deleteKey(keyName: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEY_STORE_NAME], "readwrite");
    const store = transaction.objectStore(KEY_STORE_NAME);
    const request = store.delete(keyName);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete key: ${keyName}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function hasKey(keyName: string): Promise<boolean> {
  const key = await getKey(keyName);
  return key !== null;
}

export async function clearAllKeys(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KEY_STORE_NAME], "readwrite");
    const store = transaction.objectStore(KEY_STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to clear all keys"));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function saveMessagesForUser(
  userId: string,
  records: CachedMessageRecord[],
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MESSAGE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(MESSAGE_STORE_NAME);
    const index = store.index(MESSAGE_INDEX_BY_USER);
    const retainIds = new Set(records.map((record) => record.id));
    const range = IDBKeyRange.only(userId);

    const cursorRequest = index.openKeyCursor(range);

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursor | null>).result;
      if (cursor) {
        const existingId = cursor.primaryKey as string;
        if (!retainIds.has(existingId)) {
          store.delete(existingId);
        }
        cursor.continue();
        return;
      }

      for (const record of records) {
        store.put({
          ...record,
          userId,
        });
      }
    };

    cursorRequest.onerror = () => {
      reject(new Error("Failed to iterate cached messages"));
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error("Failed to cache messages"));
    };
  });
}

export async function getCachedMessagesForUser(
  userId: string,
): Promise<CachedMessageRecord[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MESSAGE_STORE_NAME], "readonly");
    const store = transaction.objectStore(MESSAGE_STORE_NAME);
    const index = store.index(MESSAGE_INDEX_BY_USER);
    const range = IDBKeyRange.only(userId);
    const results: CachedMessageRecord[] = [];

    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
        .result;
      if (cursor) {
        results.push(cursor.value as CachedMessageRecord);
        cursor.continue();
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to read cached messages"));
    };

    transaction.oncomplete = () => {
      db.close();
      resolve(results);
    };
  });
}

export async function clearCachedMessagesForUser(userId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MESSAGE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(MESSAGE_STORE_NAME);
    const index = store.index(MESSAGE_INDEX_BY_USER);
    const range = IDBKeyRange.only(userId);

    const request = index.openKeyCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursor | null>).result;
      if (cursor) {
        store.delete(cursor.primaryKey as string);
        cursor.continue();
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to clear cached messages"));
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error("Failed to clear cached messages"));
    };
  });
}

export async function cacheDeviceWrap(
  record: CachedDeviceWrapRecord,
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DEVICE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(DEVICE_STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to cache device wrap"));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function getCachedDeviceWrap(
  deviceId: string,
): Promise<CachedDeviceWrapRecord | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DEVICE_STORE_NAME], "readonly");
    const store = transaction.objectStore(DEVICE_STORE_NAME);
    const request = store.get(deviceId);

    request.onsuccess = () => {
      resolve(request.result ?? null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to read cached wrap for device: ${deviceId}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

export async function clearCachedDeviceWrap(deviceId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DEVICE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(DEVICE_STORE_NAME);
    const request = store.delete(deviceId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear cached wrap for device: ${deviceId}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}
