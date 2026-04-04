import { Model } from '@nozbe/watermelondb';
import { text, field } from '@nozbe/watermelondb/decorators';

export class PaymentModel extends Model {
  static table = 'payments';
  static associations = {
    transactions: { type: 'belongs_to', key: 'transaction_id' },
  } as const;

  @text('transaction_id') transactionId!: string;
  @text('method') method!: 'CASH' | 'GCASH' | 'MAYA';
  @field('amount') amount!: number;
  @text('reference_number') referenceNumber!: string;
  @text('receipt_photo_uri') receiptPhotoUri!: string;
}
