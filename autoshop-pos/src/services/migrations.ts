import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'users',
          columns: [{ name: 'pin_lookup_hash', type: 'string' }],
        }),
      ],
    },
  ],
});
