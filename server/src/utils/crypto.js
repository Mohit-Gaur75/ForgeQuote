// server/src/utils/crypto.js
import { randomBytes, createHash } from 'crypto';
import argon2 from 'argon2';

/**
 * Hash a password using Argon2id with production parameters.
 * @param {string} plaintext
 * @returns {Promise<string>}
 */
export async function hashPassword(plaintext) {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify a password against an Argon2id hash.
 * @param {string} hash
 * @param {string} plaintext
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, plaintext) {
  return argon2.verify(hash, plaintext);
}

/**
 * Generate a cryptographically secure 32-byte opaque session token.
 * @returns {string} 64-character hex string
 */
export function generateToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256 for secure DB storage.
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compute SHA-256 hash of arbitrary input.
 * @param {string} input
 * @returns {string}
 */
export function hashInput(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}
