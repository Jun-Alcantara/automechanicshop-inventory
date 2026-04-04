import type { LineItem, PaymentInput } from '../types';

export interface TransactionTotals {
  subtotal: number;    // sum of all line item subtotals (before VAT, after discount)
  totalVat: number;   // sum of all line item vatAmounts
  totalAmount: number; // total due (sum of all line item totals)
  changeDue: number;  // cash change (totalCash - max(0, totalAmount - totalNonCash))
}

/**
 * Sums all line items into transaction-level totals.
 */
export const calculateTransactionTotals = (lineItems: LineItem[]): Omit<TransactionTotals, 'changeDue'> => {
  let subtotal = 0;
  let totalVat = 0;
  let totalAmount = 0;

  for (const item of lineItems) {
    subtotal += item.subtotal;
    totalVat += item.vatAmount;
    totalAmount += item.total;
  }

  return {
    subtotal: round(subtotal),
    totalVat: round(totalVat),
    totalAmount: round(totalAmount),
  };
};

/**
 * Computes cash change due given the payment entries and the total amount.
 *
 * Rules (from functional_requirements.md §4.5):
 * - E-wallet amounts are capped at remaining unpaid balance
 * - Change is computed on the CASH portion only
 * - change = cashAmount - max(0, totalAmount - nonCashTotal)
 */
export const calculateChangeDue = (
  totalAmount: number,
  payments: PaymentInput[]
): number => {
  const cashTotal = payments
    .filter((p) => p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const nonCashTotal = payments
    .filter((p) => p.method !== 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingAfterNonCash = Math.max(0, totalAmount - nonCashTotal);
  const change = cashTotal - remainingAfterNonCash;

  return round(Math.max(0, change));
};

const round = (value: number): number =>
  Math.round(value * 100) / 100;
