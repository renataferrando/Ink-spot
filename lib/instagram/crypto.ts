/**
 * AES-256-GCM helpers for encrypting Instagram long-lived tokens at rest.
 *
 * Storage format: "<base64(iv)>.<base64(ciphertext+authTag)>"
 *   - IV is 12 random bytes per encryption (NIST recommendation for GCM).
 *   - The authentication tag is appended to the ciphertext by Node's
 *     `createCipheriv`/`final()` pipeline when we explicitly request it via
 *     `cipher.getAuthTag()`, and verified by GCM on decrypt.
 *
 * The key is sourced from env.TOKEN_ENCRYPTION_KEY (base64, 32 raw bytes).
 * Rotating the key invalidates every existing ciphertext — only safe before
 * any tokens have been stored.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { env } from "@/lib/validations/env";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function loadKey(): Buffer {
  const raw = env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set; cannot encrypt/decrypt Instagram tokens.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes; got ${key.length}. Regenerate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${Buffer.concat([ct, tag]).toString("base64")}`;
}

export function decryptToken(payload: string): string {
  const key = loadKey();
  const [ivB64, ctB64] = payload.split(".");
  if (!ivB64 || !ctB64) {
    throw new Error("Malformed encrypted token payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const ctWithTag = Buffer.from(ctB64, "base64");
  // GCM tag is the last 16 bytes that the cipher appended.
  const tag = ctWithTag.subarray(ctWithTag.length - 16);
  const ct = ctWithTag.subarray(0, ctWithTag.length - 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf8");
}
