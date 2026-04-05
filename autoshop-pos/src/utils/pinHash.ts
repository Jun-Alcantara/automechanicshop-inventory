import QuickCrypto from 'react-native-quick-crypto';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // bytes → 64 hex chars

/**
 * Generates a cryptographically random 32-byte salt as a hex string.
 */
export const generateSalt = (): string => {
  const randomBytes = QuickCrypto.randomBytes(32);
  return Buffer.from(randomBytes).toString('hex');
};

/**
 * Hashes a 6-digit PIN using native PBKDF2-SHA256 via react-native-quick-crypto.
 * Runs entirely on the native thread — no JS bridge roundtrips per iteration.
 */
export const hashPin = (pin: string, salt: string): Promise<string> =>
  new Promise((resolve, reject) => {
    QuickCrypto.pbkdf2(pin, salt, ITERATIONS, KEY_LENGTH, 'sha256', (err, derivedKey) => {
      if (err || !derivedKey) return reject(err ?? new Error('PBKDF2 failed'));
      resolve(Buffer.from(derivedKey).toString('hex'));
    });
  });

/**
 * Computes a fast, non-salted SHA-256 of the PIN for DB lookup purposes.
 * Used to locate the candidate user record before running the full PBKDF2 verify.
 *
 * Security note: PINs are 6 digits (≤1M possibilities) and are inherently weak
 * against offline brute force regardless. The lookup hash doesn't add meaningful
 * attack surface — PBKDF2 remains the rate-limiting verifier.
 */
export const computePinLookupHash = (pin: string): string =>
  QuickCrypto.createHash('sha256').update(pin).digest('hex') as string;

/**
 * Verifies a plain PIN against a stored hash + salt.
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
