import { calculateLineItem } from '../calculateLineItem';

describe('calculateLineItem', () => {
  it('NO_VAT: total = unit_price × qty', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 2, vatType: 'NO_VAT',
      discountType: '', discountValue: 0, addOnsTotal: 0,
    });
    expect(result.subtotal).toBe(200);
    expect(result.vatAmount).toBe(0);
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(200);
  });

  it('VAT_EXCLUSIVE: adds 12% on top', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 1, vatType: 'VAT_EXCLUSIVE',
      discountType: '', discountValue: 0, addOnsTotal: 0,
    });
    expect(result.vatAmount).toBe(12);
    expect(result.total).toBe(112);
  });

  it('VAT_INCLUSIVE: extracts VAT from price', () => {
    const result = calculateLineItem({
      unitPrice: 112, quantity: 1, vatType: 'VAT_INCLUSIVE',
      discountType: '', discountValue: 0, addOnsTotal: 0,
    });
    // VAT = 112 × (0.12 / 1.12) ≈ 12
    expect(result.vatAmount).toBeCloseTo(12, 1);
    expect(result.total).toBeCloseTo(112, 1);
  });

  it('FIXED discount reduces subtotal', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 2, vatType: 'NO_VAT',
      discountType: 'FIXED', discountValue: 50, addOnsTotal: 0,
    });
    expect(result.discountAmount).toBe(50);
    expect(result.total).toBe(150);
  });

  it('PERCENTAGE discount reduces subtotal by percentage', () => {
    const result = calculateLineItem({
      unitPrice: 200, quantity: 1, vatType: 'NO_VAT',
      discountType: 'PERCENTAGE', discountValue: 10, addOnsTotal: 0,
    });
    expect(result.discountAmount).toBe(20);
    expect(result.total).toBe(180);
  });

  it('addOnsTotal adds to total', () => {
    const result = calculateLineItem({
      unitPrice: 100, quantity: 1, vatType: 'NO_VAT',
      discountType: '', discountValue: 0, addOnsTotal: 25,
    });
    expect(result.total).toBe(125);
  });
});
