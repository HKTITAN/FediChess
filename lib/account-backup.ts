/**
 * Secure account export/import: ELO record, game history, display name.
 * Payload is signed with HMAC-SHA-256 (key from PBKDF2 + password) so backups cannot be modified for fair play.
 */
import { set } from "idb-keyval";
import type { EloRecord, GameHistoryEntry } from "./elo";

const ELO_DB_KEY = "p2p-chess-elo";
const HISTORY_DB_KEY = "p2p-chess-history";
const NAME_STORAGE_KEY = "p2p-chess-name";
const EXPORT_VERSION = 1;
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HMAC_KEY_LENGTH = 256;

export interface AccountPayload {
  eloRecord: EloRecord;
  history: GameHistoryEntry[];
  name: string;
}

export interface AccountExportFile {
  version: number;
  salt: string;
  payload: AccountPayload;
  sig: string;
}

/** Deterministic JSON stringify (sorted keys) so HMAC verification reproduces the same bytes. */
function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalStringify(item)).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(
    (k) => JSON.stringify(k) + ":" + canonicalStringify((obj as Record<string, unknown>)[k])
  );
  return "{" + pairs.join(",") + "}";
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: HMAC_KEY_LENGTH },
    false,
    ["sign"]
  );
}

async function hmacSign(key: CryptoKey, data: string): Promise<string> {
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bufferToHex(sig);
}

async function hmacVerify(key: CryptoKey, data: string, expectedHex: string): Promise<boolean> {
  const computed = await hmacSign(key, data);
  if (computed.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

/** Build payload from current IndexedDB and localStorage. */
export async function buildPayload(): Promise<AccountPayload> {
  const { getEloRecord, getHistory } = await import("./elo");
  const eloRecord = await getEloRecord();
  const history = await getHistory();
  let name = "Player";
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(NAME_STORAGE_KEY);
      if (stored) name = stored;
    } catch {
      // ignore
    }
  }
  return { eloRecord, history, name };
}

/**
 * Export account to a signed object. Password is used only to derive HMAC key; payload is not encrypted.
 */
export async function exportAccount(password: string): Promise<AccountExportFile> {
  if (!password || password.length === 0) {
    throw new Error("Password is required for export");
  }
  const payload = await buildPayload();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(password, salt);
  const canonical = canonicalStringify(payload);
  const sig = await hmacSign(key, canonical);
  return {
    version: EXPORT_VERSION,
    salt: bufferToBase64(salt),
    payload,
    sig,
  };
}

/**
 * Verify and import account. Writes to IndexedDB and localStorage only if signature is valid.
 */
export async function importAccount(
  file: AccountExportFile,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.version !== EXPORT_VERSION) {
    return { ok: false, error: "Unsupported backup version" };
  }
  if (!file.payload || !file.salt || !file.sig) {
    return { ok: false, error: "Invalid password or corrupted backup" };
  }
  const salt = base64ToBuffer(file.salt);
  const key = await deriveKey(password, salt);
  const canonical = canonicalStringify(file.payload);
  const valid = await hmacVerify(key, canonical, file.sig);
  if (!valid) {
    return { ok: false, error: "Invalid password or corrupted backup" };
  }
  const { eloRecord, history, name } = file.payload;
  try {
    await set(ELO_DB_KEY, eloRecord);
    await set(HISTORY_DB_KEY, Array.isArray(history) ? history : []);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(NAME_STORAGE_KEY, typeof name === "string" ? name : "Player");
      } catch {
        // ignore
      }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to write data" };
  }
  return { ok: true };
}
