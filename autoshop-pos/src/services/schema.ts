import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [

    tableSchema({
      name: 'users',
      columns: [
        { name: 'display_name', type: 'string' },
        { name: 'pin_hash', type: 'string' },
        { name: 'pin_salt', type: 'string' },
        { name: 'permissions', type: 'string' }, // JSON array string
        { name: 'is_main_admin', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
        { name: 'updated_at', type: 'number' },
        { name: 'updated_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'suppliers',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'contact_info', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'add_ons',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'selling_price', type: 'number' },
        { name: 'cost_price', type: 'number' },
        { name: 'unit_of_measure', type: 'string' },
        { name: 'stock_available', type: 'number' },
        { name: 'stock_reserved', type: 'number' },
        { name: 'low_stock_threshold', type: 'number' },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'supplier_id', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
        { name: 'updated_at', type: 'number' },
        { name: 'updated_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'services',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'base_price', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
        { name: 'updated_at', type: 'number' },
        { name: 'updated_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'customers',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'vehicles',
      columns: [
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'make', type: 'string' },
        { name: 'model', type: 'string', isOptional: true },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'plate_number', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'vehicle_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'cashier_id', type: 'string' },
        { name: 'subtotal', type: 'number' },
        { name: 'total_vat', type: 'number' },
        { name: 'total_amount', type: 'number' },
        { name: 'change_due', type: 'number' },
        { name: 'has_return', type: 'boolean' },
        { name: 'original_transaction_id', type: 'string', isOptional: true },
        { name: 'void_reason', type: 'string', isOptional: true },
        { name: 'voided_by', type: 'string', isOptional: true },
        { name: 'voided_at', type: 'number', isOptional: true },
        { name: 'return_reason', type: 'string', isOptional: true },
        { name: 'returned_by', type: 'string', isOptional: true },
        { name: 'returned_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'created_by', type: 'string' },
        { name: 'finalized_at', type: 'number', isOptional: true },
        { name: 'finalized_by', type: 'string', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'line_items',
      columns: [
        { name: 'transaction_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'ref_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'unit_price', type: 'number' },
        { name: 'quantity', type: 'number' },
        { name: 'vat_type', type: 'string' },
        { name: 'discount_type', type: 'string', isOptional: true },
        { name: 'discount_value', type: 'number' },
        { name: 'subtotal', type: 'number' },
        { name: 'vat_amount', type: 'number' },
        { name: 'discount_amount', type: 'number' },
        { name: 'total', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'line_item_add_ons',
      columns: [
        { name: 'line_item_id', type: 'string', isIndexed: true },
        { name: 'add_on_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'is_on_the_fly', type: 'boolean' },
      ],
    }),

    tableSchema({
      name: 'payments',
      columns: [
        { name: 'transaction_id', type: 'string', isIndexed: true },
        { name: 'method', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'reference_number', type: 'string', isOptional: true },
        { name: 'receipt_photo_uri', type: 'string', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'audit_logs',
      columns: [
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'user_name', type: 'string' },
        { name: 'action_type', type: 'string', isIndexed: true },
        { name: 'entity_type', type: 'string', isIndexed: true },
        { name: 'entity_id', type: 'string' },
        { name: 'before', type: 'string', isOptional: true },
        { name: 'after', type: 'string', isOptional: true },
        { name: 'note', type: 'string', isOptional: true },
      ],
    }),

  ],
});
