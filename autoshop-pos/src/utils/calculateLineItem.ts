import { VAT_RATE, VAT_TYPES, type VatType } from '../constants/vatTypes';

export interface LineItemInput {
  unitPrice: number;
  quantity: number;
  vatType: VatType;
  discountType: 'FIXED' | 'PERCENTAGE' | '';
  discountValue: number;
  addOnsTotal: number; // sum of all add-on amounts for this line item
}

export interface LineItemCalcResult {
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  total: number;
}

/**
 * Computes all derived monetary fields for a single line item.
 * All amounts are in PHP, rounded to 2 decimal places.
 */
export const calculateLineItem = (input: LineItemInput): LineItemCalcResult => {
  const { unitPrice, quantity, vatType, discountType, discountValue, addOnsTotal } = input;

  const subtotal = round(unitPrice * quantity);

  // Discount
  let discountAmount = 0;
  if (discountType === 'FIXED') {
    discountAmount = Math.min(discountValue, subtotal); // can't discount more than the item cost
  } else if (discountType === 'PERCENTAGE') {
    discountAmount = round((subtotal * discountValue) / 100);
  }

  const discountedSubtotal = round(subtotal - discountAmount);

  // VAT
  let vatAmount = 0;
  if (vatType === VAT_TYPES.VAT_EXCLUSIVE) {
    // Price does NOT include VAT — add 12% on top
    vatAmount = round(discountedSubtotal * VAT_RATE);
  } else if (vatType === VAT_TYPES.VAT_INCLUSIVE) {
    // Price ALREADY includes VAT — extract the VAT component
    // VAT = price × (rate / (1 + rate))
    vatAmount = round(discountedSubtotal * (VAT_RATE / (1 + VAT_RATE)));
  }
  // VAT_TYPES.NO_VAT → vatAmount stays 0

  // For VAT_INCLUSIVE, vatAmount is extracted from the price (already included), not added on top.
  const vatAddOn = vatType === VAT_TYPES.VAT_EXCLUSIVE ? vatAmount : 0;
  const total = round(discountedSubtotal + vatAddOn + addOnsTotal);

  return { subtotal, vatAmount, discountAmount, total };
};

const round = (value: number): number =>
  Math.round(value * 100) / 100;
