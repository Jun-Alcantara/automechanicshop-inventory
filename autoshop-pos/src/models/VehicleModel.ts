import { Model } from '@nozbe/watermelondb';
import { text, date } from '@nozbe/watermelondb/decorators';

export class VehicleModel extends Model {
  static table = 'vehicles';

  @text('customer_id') customerId!: string;
  @text('make') make!: string;
  @text('model') model!: string;
  @text('color') color!: string;
  @text('plate_number') plateNumber!: string;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
}
