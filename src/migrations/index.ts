import * as migration_20261018_000001_initial from './20261018_000001_initial';
import * as migration_20261018_073048_full_schema from './20261018_073048_full_schema';

export const migrations = [
  {
    up: migration_20261018_000001_initial.up,
    down: migration_20261018_000001_initial.down,
    name: '20261018_000001_initial',
  },
  {
    up: migration_20261018_073048_full_schema.up,
    down: migration_20261018_073048_full_schema.down,
    name: '20261018_073048_full_schema'
  },
];
