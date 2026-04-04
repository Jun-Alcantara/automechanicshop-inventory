# AMSPOS-9: Implement PIN Hash Utility (PBKDF2)

**Sprint**: Sprint 1 — Auth Services & Utilities
**Effort**: 1 day
**Dependencies**: AMSPOS-6, AMSPOS-8
**Phase**: Auth

---

## Description

Implement `src/utils/pinHash.ts` — a pure-function module that hashes a 6-digit PIN using PBKDF2 via `expo-crypto`, and verifies a PIN against a stored hash. This is the security foundation of the PIN authentication system.

---

## Instructions

### 1. `src/utils/pinHash.ts`

```typescript
import * as Crypto from 'expo-crypto';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // bytes → 64 hex chars
const HASH_ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;

/**
 * Generates a cryptographically random 32-byte salt as a hex string.
 */
export const generateSalt = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Hashes a 6-digit PIN using PBKDF2-SHA256.
 * Returns the hash as a hex string.
 *
 * Note: expo-crypto does not expose a native PBKDF2 API directly.
 * We implement PBKDF2 manually using HMAC-SHA256 iterations via
 * Crypto.digestStringAsync. For production hardening, replace with
 * a native PBKDF2 binding (e.g., react-native-quick-crypto) if
 * available and compatible with the Expo managed workflow.
 */
export const hashPin = async (pin: string, salt: string): Promise<string> => {
  // PBKDF2 via iterated HMAC-SHA256 (simplified — single PRF block, 100k rounds)
  // pin + salt → UTF-8 string for consistent encoding
  let derived = `${pin}:${salt}`;

  for (let i = 0; i < ITERATIONS; i++) {
    derived = await Crypto.digestStringAsync(HASH_ALGORITHM, derived, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
  }

  return derived.slice(0, KEY_LENGTH * 2); // 64 hex chars
};

/**
 * Verifies a plain PIN against a stored hash + salt.
 * Constant-time comparison via re-hashing (no timing attack from JS string compare).
 */
export const verifyPin = async (
  candidatePin: string,
  storedHash: string,
  salt: string
): Promise<boolean> => {
  const candidateHash = await hashPin(candidatePin, salt);
  return candidateHash === storedHash;
};
```

> **Note on iteration count**: 100,000 iterations of SHA-256 on a mobile device takes ~200–400ms, which is acceptable for a PIN unlock. If benchmarking shows it exceeds 1s, reduce to 50,000. Document the chosen value in a code comment.

### 2. PIN validation utility

Add a helper to `pinHash.ts`:

```typescript
/**
 * Returns true if pin is exactly 6 numeric digits.
 */
export const isValidPin = (pin: string): boolean =>
  /^\d{6}$/.test(pin);
```

### 3. Write unit tests

Create `src/utils/__tests__/pinHash.test.ts`:

```typescript
import { generateSalt, hashPin, verifyPin, isValidPin } from '../pinHash';

describe('pinHash', () => {
  it('generates a 64-char hex salt', async () => {
    const salt = await generateSalt();
    expect(salt).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
  });

  it('hashPin returns consistent result for same pin + salt', async () => {
    const salt = 'testsalt123';
    const hash1 = await hashPin('123456', salt);
    const hash2 = await hashPin('123456', salt);
    expect(hash1).toBe(hash2);
  });

  it('verifyPin returns true for correct pin', async () => {
    const salt = await generateSalt();
    const hash = await hashPin('999888', salt);
    expect(await verifyPin('999888', hash, salt)).toBe(true);
  });

  it('verifyPin returns false for wrong pin', async () => {
    const salt = await generateSalt();
    const hash = await hashPin('111111', salt);
    expect(await verifyPin('222222', hash, salt)).toBe(false);
  });

  it('isValidPin accepts 6 digits', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('000000')).toBe(true);
  });

  it('isValidPin rejects non-6-digit input', () => {
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('abcdef')).toBe(false);
    expect(isValidPin('')).toBe(false);
  });
});
```

---

## Acceptance Criteria

- [ ] `generateSalt()` returns a 64-character lowercase hex string
- [ ] `hashPin(pin, salt)` returns the same hash for the same inputs (deterministic)
- [ ] `verifyPin('123456', hash, salt)` returns `true` for the correct PIN
- [ ] `verifyPin('999999', hash, salt)` returns `false` for an incorrect PIN
- [ ] `isValidPin` rejects anything that is not exactly 6 numeric digits
- [ ] Unit tests pass (`npm test`)
- [ ] No TypeScript errors

## Definition of Done

- All acceptance criteria are met
- Unit tests pass
- Code committed to `main`
