const DB_NAME = "CSESyncDB";
const DB_VERSION = 1;
const KEY_STORE_NAME = "keys";

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
