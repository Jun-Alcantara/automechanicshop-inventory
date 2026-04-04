import { Model } from '@nozbe/watermelondb';
import { text, field } from '@nozbe/watermelondb/decorators';

export class LineItemAddOnModel extends Model {
  static table = 'line_item_add_ons';
  static associations = {
    line_items: { type: 'belongs_to', key: 'line_item_id' },
  } as const;

  @text('line_item_id') lineItemId!: string;
  @text('add_on_id') addOnId!: string;
  @text('name') name!: string;
  @field('amount') amount!: number;
  @field('is_on_the_fly') isOnTheFly!: boolean;
}
