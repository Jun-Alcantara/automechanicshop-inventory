import { Model } from '@nozbe/watermelondb';
import { text, field, date } from '@nozbe/watermelondb/decorators';

export class ProductModel extends Model {
  static table = 'products';

  @text('name') name!: string;
  @text('barcode') barcode!: string;
  @field('selling_price') sellingPrice!: number;
  @field('cost_price') costPrice!: number;
  @text('unit_of_measure') unitOfMeasure!: string;
  @field('stock_available') stockAvailable!: number;
  @field('stock_reserved') stockReserved!: number;
  @field('low_stock_threshold') lowStockThreshold!: number;
  @text('category_id') categoryId!: string;
  @text('supplier_id') supplierId!: string;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @text('created_by') createdBy!: string;
  @date('updated_at') updatedAt!: Date;
  @text('updated_by') updatedBy!: string;
}
