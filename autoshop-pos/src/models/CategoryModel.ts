import { Model } from '@nozbe/watermelondb';
import { text, date } from '@nozbe/watermelondb/decorators';

export class CategoryModel extends Model {
  static table = 'categories';

  @text('name') name!: string;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
