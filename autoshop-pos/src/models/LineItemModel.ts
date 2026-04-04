import { Model } from '@nozbe/watermelondb';
import { text, field, children } from '@nozbe/watermelondb/decorators';

export class LineItemModel extends Model {
  static table = 'line_items';
  static associations = {
    transactions: { type: 'belongs_to', key: 'transaction_id' },
    line_item_add_ons: { type: 'has_many', foreignKey: 'line_item_id' },
  } as const;

  @text('transaction_id') transactionId!: string;
  @text('type') type!: 'PRODUCT' | 'SERVICE';
  @text('ref_id') refId!: string;
  @text('name') name!: string;
  @field('unit_price') unitPrice!: number;
  @field('quantity') quantity!: number;
  @text('vat_type') vatType!: string;
  @text('discount_type') discountType!: string;
  @field('discount_value') discountValue!: number;
  @field('subtotal') subtotal!: number;
  @field('vat_amount') vatAmount!: number;
  @field('discount_amount') discountAmount!: number;
  @field('total') total!: number;

  @children('line_item_add_ons') addOns!: any;
}
