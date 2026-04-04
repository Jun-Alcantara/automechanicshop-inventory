import { Model } from '@nozbe/watermelondb';
import { text, date } from '@nozbe/watermelondb/decorators';

export class SupplierModel extends Model {
  static table = 'suppliers';

  @text('name') name!: string;
  @text('contact_info') contactInfo!: string;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
