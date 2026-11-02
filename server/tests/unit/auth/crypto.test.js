import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, hashToken, hashInput } from '../../../src/utils/crypto.js';

describe('Crypto & Security Utilities', () => {
  it('hashes and verifies passwords correctly with Argon2id', async () => {
    const password = 'TestSecurePassword@123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, 'WrongPassword');
    expect(isInvalid).toBe(false);
  });

  it('generates 32-byte opaque session tokens (64 hex characters)', () => {
    const token1 = generateToken();
    const token2 = generateToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('produces consistent SHA-256 digests for tokens and inputs', () => {
    const token = 'abcdef123456';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);

    const inputHash = hashInput('Customer RFQ Text');
    expect(inputHash).toHaveLength(64);
  });
});
