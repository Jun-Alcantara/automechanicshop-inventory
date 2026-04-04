/**
 * Formats a number as Philippine Peso.
 * Examples:
 *   formatPHP(1234.5)  → "₱1,234.50"
 *   formatPHP(0)       → "₱0.00"
 *   formatPHP(-50)     → "-₱50.00"
 */
export const formatPHP = (amount: number): string => {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-₱${formatted}` : `₱${formatted}`;
};

/**
 * Parses a formatted PHP string back to a number.
 * Returns NaN if the string cannot be parsed.
 * Example: parsePHP("₱1,234.50") → 1234.5
 */
export const parsePHP = (value: string): number => {
  const cleaned = value.replace(/[₱,\s]/g, '');
  return parseFloat(cleaned);
};
