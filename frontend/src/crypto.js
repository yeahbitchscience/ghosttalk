// WebCrypto API helper for E2E Encrypted Messaging

const DB_NAME = 'GhostTalkDB';
const STORE_NAME = 'keys';

const getDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const setPrivateKeyIdb = async (keyData) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(keyData, 'privateKey');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getPrivateKeyIdb = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get('privateKey');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(tx.error);
  });
};

export const clearPrivateKeyIdb = async () => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('privateKey');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  await setPrivateKeyIdb(JSON.stringify(privateKeyJwk));
  
  return { publicKeyJwk, privateKeyJwk };
};

export const deriveKeyFromPassword = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const encryptPrivateKey = async (privateKeyJwk, password, username) => {
  const key = await deriveKeyFromPassword(password, username);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(privateKeyJwk))
  );
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
};

export const decryptPrivateKey = async (encryptedData, password, username) => {
  const key = await deriveKeyFromPassword(password, username);
  const iv = new Uint8Array(encryptedData.iv);
  const data = new Uint8Array(encryptedData.data);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
};

export const encryptMessage = async (message, recipientPublicKeyJwk) => {
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);

  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    recipientPublicKeyJwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    encodedMessage
  );

  return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
};

export const decryptMessage = async (encryptedMessageBase64) => {
  try {
    const privateKeyJwkStr = await getPrivateKeyIdb();
    if (!privateKeyJwkStr) return "[Key Missing - Cannot Decrypt]";
    
    const privateKeyJwk = JSON.parse(privateKeyJwkStr);
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );

    const encryptedBuffer = Uint8Array.from(atob(encryptedMessageBase64), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed", err);
    return "[Encrypted Message]";
  }
};
