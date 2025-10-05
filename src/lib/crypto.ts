const enc = new TextEncoder();
const dec = new TextDecoder();

// Narrow type for WebCrypto-like object
type WebCryptoLike = { getRandomValues: (arr: Uint8Array) => Uint8Array };

function getCryptoForRandom(): WebCryptoLike | undefined {
  if (typeof window !== 'undefined') {
    const w = window as unknown as { crypto?: WebCryptoLike };
    if (w.crypto && typeof w.crypto.getRandomValues === 'function') return w.crypto;
  }
  const g = globalThis as unknown as { crypto?: WebCryptoLike };
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') return g.crypto;
  return undefined;
}

// --- Helpers (base64) ---
function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  if (typeof btoa !== 'function') throw new Error('btoa not available in this environment');
  const bytes = new Uint8Array(buffer as ArrayBufferLike);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  if (typeof b64 !== 'string' || b64.length === 0) {
    throw new Error(`base64ToArrayBuffer expected a non-empty base64 string, got: ${String(b64)}`);
  }
  // Normalize base64url -> base64
  let base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if missing
  const pad = base64.length % 4;
  if (pad === 1) {
    // Invalid base64 length
    throw new Error('Invalid base64 string length');
  }
  if (pad > 0) base64 += '='.repeat(4 - pad);

  if (typeof atob !== 'function') throw new Error('atob not available in this environment');
  let binary: string;
  try {
    binary = atob(base64);
  } catch (err) {
    throw new Error(`Failed to decode base64 string: ${err instanceof Error ? err.message : String(err)}`);
  }
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// --- Salt / IV generation ---
export function generateSalt(length = 16): Uint8Array {
  const cryptoObj = getCryptoForRandom();
  if (!cryptoObj) throw new Error('No crypto available to generate random values');
  return cryptoObj.getRandomValues(new Uint8Array(length));
}

export function generateIv(): Uint8Array {
  // AES-GCM standard IV size is 12 bytes
  const cryptoObj = getCryptoForRandom();
  if (!cryptoObj) throw new Error('No crypto available to generate random values');
  return cryptoObj.getRandomValues(new Uint8Array(12));
}

// --- Key derivation (PBKDF2 -> AES-GCM CryptoKey) ---
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  // Import raw password material
  const passKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive an AES-GCM 256-bit key
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // WebCrypto expects a BufferSource for salt
      salt: salt as unknown as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

// --- Encrypt a single string value -> { ciphertext, iv } ---
export async function encryptString(
  key: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: number[] }> {
  const iv = generateIv();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: Array.from(iv),
  };
}

// --- Decrypt a single field produced by encryptString ---
export async function decryptString(
  key: CryptoKey,
  ciphertextB64: string | undefined | null,
  ivArr: number[] | undefined | null
): Promise<string | null> {
  // Defensive checks: if ciphertext or iv are missing, return null
  if (typeof ciphertextB64 !== 'string' || ciphertextB64.length === 0) {
    console.warn('decryptString called with empty ciphertext');
    return null;
  }
  if (!Array.isArray(ivArr) || ivArr.length === 0) {
    console.warn('decryptString called with missing/empty iv');
    return null;
  }

  try {
    const iv = new Uint8Array(ivArr);
    const ciphertextBuffer = base64ToArrayBuffer(ciphertextB64);
    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      ciphertextBuffer
    );
    return dec.decode(plainBuffer);
  } catch (err) {
    console.error('decryptString failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// --- Encrypt multiple vault fields at once (title is not encrypted by default) ---
export type EncryptedField = { ciphertext: string; iv: number[] };

export async function encryptVaultItemFields(
  key: CryptoKey,
  fields: { username?: string; password?: string; url?: string; notes?: string }
): Promise<{
  username?: EncryptedField;
  password?: EncryptedField;
  url?: EncryptedField;
  notes?: EncryptedField;
}> {
  const out: {
    username?: EncryptedField;
    password?: EncryptedField;
    url?: EncryptedField;
    notes?: EncryptedField;
  } = {};
  if (fields.username !== undefined)
    out.username = await encryptString(key, fields.username);
  if (fields.password !== undefined)
    out.password = await encryptString(key, fields.password);
  if (fields.url !== undefined) out.url = await encryptString(key, fields.url);
  if (fields.notes !== undefined)
    out.notes = await encryptString(key, fields.notes);
  return out;
}

export async function decryptVaultItemFields(
  key: CryptoKey,
  fields: {
    username?: EncryptedField | null;
    password?: EncryptedField | null;
    url?: EncryptedField | null;
    notes?: EncryptedField | null;
  }
): Promise<{
  username?: string | null;
  password?: string | null;
  url?: string | null;
  notes?: string | null;
}> {
  const out: {
    username?: string | null;
    password?: string | null;
    url?: string | null;
    notes?: string | null;
  } = {};
  if (fields.username)
    out.username = await decryptString(
      key,
      fields.username.ciphertext,
      fields.username.iv
    );
  if (fields.password)
    out.password = await decryptString(
      key,
      fields.password.ciphertext,
      fields.password.iv
    );
  if (fields.url)
    out.url = await decryptString(key, fields.url.ciphertext, fields.url.iv);
  if (fields.notes)
    out.notes = await decryptString(
      key,
      fields.notes.ciphertext,
      fields.notes.iv
    );
  return out;
}

// --- Utility to convert salt to storable string and back ---
export function saltToBase64(salt: Uint8Array): string {
  return arrayBufferToBase64(salt.buffer);
}

export function base64ToSalt(b64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(b64));
}
