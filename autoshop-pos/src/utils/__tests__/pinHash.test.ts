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
