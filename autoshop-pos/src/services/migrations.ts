import { createMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = createMigrations({
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
