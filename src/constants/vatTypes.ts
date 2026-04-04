export const VAT_TYPES = {
  NO_VAT: 'NO_VAT',
  VAT_EXCLUSIVE: 'VAT_EXCLUSIVE',
  VAT_INCLUSIVE: 'VAT_INCLUSIVE',
} as const;

export type VatType = typeof VAT_TYPES[keyof typeof VAT_TYPES];

export const VAT_LABELS: Record<VatType, string> = {
  NO_VAT: 'No VAT',
  VAT_EXCLUSIVE: 'VAT Exclusive (+ 12%)',
  VAT_INCLUSIVE: 'VAT Inclusive (incl. 12%)',
};

export const VAT_RATE = 0.12;
export const DEFAULT_VAT_TYPE: VatType = VAT_TYPES.VAT_INCLUSIVE;
