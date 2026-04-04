import { Model } from '@nozbe/watermelondb';
import { text, field, date } from '@nozbe/watermelondb/decorators';

export class ServiceModel extends Model {
  static table = 'services';

  @text('name') name!: string;
  @field('base_price') basePrice!: number;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
