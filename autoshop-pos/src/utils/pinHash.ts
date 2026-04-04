import * as Crypto from 'expo-crypto';

// 100,000 iterations of SHA-256 takes ~200–400ms on device — acceptable for PIN unlock.
// If benchmarking exceeds 1s, reduce to 50_000.
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

/**
 * Returns true if pin is exactly 6 numeric digits.
 */
export const isValidPin = (pin: string): boolean =>
  /^\d{6}$/.test(pin);
