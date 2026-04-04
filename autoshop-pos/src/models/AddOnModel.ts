import { Model } from '@nozbe/watermelondb';
import { text, field, date } from '@nozbe/watermelondb/decorators';

export class AddOnModel extends Model {
  static table = 'add_ons';

  @text('name') name!: string;
  @field('amount') amount!: number;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
