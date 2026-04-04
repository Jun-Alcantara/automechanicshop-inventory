import { calculateTransactionTotals, calculateChangeDue } from '../calculateTransaction';
import type { LineItem } from '../../types';

const makeLineItem = (subtotal: number, vatAmount: number, total: number): LineItem =>
  ({
    subtotal,
    vatAmount,
    total,
  } as LineItem);

describe('calculateTransactionTotals', () => {
  it('sums empty line items to zeros', () => {
    const result = calculateTransactionTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.totalVat).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it('sums multiple line items', () => {
    const items = [
      makeLineItem(100, 12, 112),
      makeLineItem(200, 0, 200),
    ];
    const result = calculateTransactionTotals(items);
    expect(result.subtotal).toBe(300);
    expect(result.totalVat).toBe(12);
    expect(result.totalAmount).toBe(312);
  });

  it('rounds values to 2 decimal places', () => {
    const items = [
      makeLineItem(100.005, 12.005, 112.005),
      makeLineItem(200.005, 0, 200.005),
    ];
    const result = calculateTransactionTotals(items);
    expect(result.subtotal).toBe(300.01);
    expect(result.totalVat).toBe(12.01);
    expect(result.totalAmount).toBe(312.01);
  });
});

describe('calculateChangeDue', () => {
  it('cash only payment — change = cash - total', () => {
    const change = calculateChangeDue(500, [{ method: 'CASH', amount: 600 }]);
    expect(change).toBe(100);
  });

  it('split payment — change computed on cash after non-cash covers part', () => {
    // total 500, GCash 200, cash 400 → remaining after GCash = 300 → change = 400 - 300 = 100
    const change = calculateChangeDue(500, [
      { method: 'GCASH', amount: 200 },
      { method: 'CASH', amount: 400 },
    ]);
    expect(change).toBe(100);
  });

  it('no change when exact amount paid', () => {
    const change = calculateChangeDue(500, [{ method: 'CASH', amount: 500 }]);
    expect(change).toBe(0);
  });

  it('change is never negative', () => {
    const change = calculateChangeDue(500, [{ method: 'CASH', amount: 300 }]);
    expect(change).toBe(0);
  });

  it('non-cash fully covers total — no change even with no cash', () => {
    const change = calculateChangeDue(500, [{ method: 'GCASH', amount: 500 }]);
    expect(change).toBe(0);
  });

  it('multiple non-cash payments', () => {
    // total 500, GCASH 200, MAYA 150, CASH 200 → remaining = max(0, 500 - 350) = 150 → change = 200 - 150 = 50
    const change = calculateChangeDue(500, [
      { method: 'GCASH', amount: 200 },
      { method: 'MAYA', amount: 150 },
      { method: 'CASH', amount: 200 },
    ]);
    expect(change).toBe(50);
  });
});
