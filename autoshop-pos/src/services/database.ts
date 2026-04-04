import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

// Model classes will be imported after AMSPOS-3
// import { UserModel } from '../models/UserModel';
// ... etc.

const adapter = new SQLiteAdapter({
  schema,
  migrations: undefined, // will add migrations in a future task
  jsi: true,             // use JSI for better performance
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    // Register model classes here after AMSPOS-3
  ],
});
