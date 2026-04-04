import { formatPHP, parsePHP } from '../formatCurrency';

describe('formatPHP', () => {
  it('formats whole number', () => {
    expect(formatPHP(1000)).toBe('₱1,000.00');
  });

  it('formats decimal', () => {
    expect(formatPHP(1234.5)).toBe('₱1,234.50');
  });

  it('formats zero', () => {
    expect(formatPHP(0)).toBe('₱0.00');
  });

  it('formats negative', () => {
    expect(formatPHP(-50)).toBe('-₱50.00');
  });
});

describe('parsePHP', () => {
  it('parses formatted string back to number', () => {
    expect(parsePHP('₱1,234.50')).toBe(1234.5);
  });

  it('returns NaN for invalid string', () => {
    expect(parsePHP('abc')).toBeNaN();
  });
});
