import { Model } from '@nozbe/watermelondb';
import { text, field, date, children } from '@nozbe/watermelondb/decorators';

export class TransactionModel extends Model {
  static table = 'transactions';
  static associations = {
    line_items: { type: 'has_many', foreignKey: 'transaction_id' },
    payments: { type: 'has_many', foreignKey: 'transaction_id' },
  } as const;

  @text('status') status!: string;
  @text('customer_id') customerId!: string;
  @text('vehicle_id') vehicleId!: string;
  @text('cashier_id') cashierId!: string;
  @field('subtotal') subtotal!: number;
  @field('total_vat') totalVat!: number;
  @field('total_amount') totalAmount!: number;
  @field('change_due') changeDue!: number;
  @field('has_return') hasReturn!: boolean;
  @text('original_transaction_id') originalTransactionId!: string;
  @text('void_reason') voidReason!: string;
  @text('voided_by') voidedBy!: string;
  @field('voided_at') voidedAt!: number;
  @text('return_reason') returnReason!: string;
  @text('returned_by') returnedBy!: string;
  @field('returned_at') returnedAt!: number;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @field('finalized_at') finalizedAt!: number;
  @text('finalized_by') finalizedBy!: string;

  @children('line_items') lineItems!: any;
  @children('payments') payments!: any;
}
