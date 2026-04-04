import { Model } from '@nozbe/watermelondb';
import { text, field, date } from '@nozbe/watermelondb/decorators';

export class CustomerModel extends Model {
  static table = 'customers';

  @text('type') type!: 'NAMED' | 'WALKIN';
  @text('name') name!: string;
  @text('phone') phone!: string;
  @text('email') email!: string;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
