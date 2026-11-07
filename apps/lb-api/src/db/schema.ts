import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 2048 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  // One store per user. The unique constraint is also the index for the owner lookup.
  ownerId: uuid('owner_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 10 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    objectKey: varchar('object_key', { length: 512 }).notNull().unique(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('media_assets_owner_user_id_idx').on(table.ownerUserId)],
);

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    imageAssetId: uuid('image_asset_id')
      .notNull()
      .references(() => mediaAssets.id),
    title: varchar('title', { length: 120 }).notNull(),
    description: varchar('description', { length: 1000 }),
    originalPrice: integer('original_price'),
    currentPrice: integer('current_price').notNull(),
    initialQuantity: integer('initial_quantity').notNull(),
    remainingQuantity: integer('remaining_quantity').notNull(),
    pickupStartAt: timestamp('pickup_start_at', { withTimezone: true }).notNull(),
    pickupEndAt: timestamp('pickup_end_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    storeNameSnapshot: varchar('store_name_snapshot', { length: 100 }).notNull(),
    phoneSnapshot: varchar('phone_snapshot', { length: 10 }).notNull(),
    addressSnapshot: varchar('address_snapshot', { length: 255 }).notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('posts_store_id_idx').on(table.storeId),
    index('posts_expires_at_idx').on(table.expiresAt),
    check('posts_current_price_non_negative', sql`${table.currentPrice} >= 0`),
    check('posts_initial_quantity_positive', sql`${table.initialQuantity} > 0`),
    check(
      'posts_remaining_quantity_valid',
      sql`${table.remainingQuantity} >= 0 and ${table.remainingQuantity} <= ${table.initialQuantity}`,
    ),
    check('posts_pickup_window_valid', sql`${table.pickupStartAt} < ${table.pickupEndAt}`),
    check('posts_expiry_within_pickup_window', sql`${table.expiresAt} <= ${table.pickupEndAt}`),
    check(
      'posts_original_price_valid',
      sql`${table.originalPrice} is null or ${table.originalPrice} >= ${table.currentPrice}`,
    ),
  ],
);

export const authIdentities = pgTable(
  'auth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerSubject: varchar('provider_subject', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('auth_identities_provider_subject_unique').on(table.provider, table.providerSubject),
    index('auth_identities_user_id_idx').on(table.userId),
  ],
);

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('auth_sessions_user_id_idx').on(table.userId),
    index('auth_sessions_expires_at_idx').on(table.expiresAt),
    check(
      'auth_sessions_expires_after_creation_check',
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      'auth_sessions_max_seven_days_check',
      // Keep in sync with SESSION_TTL_DAYS in auth-session.service.ts.
      sql`${table.expiresAt} <= ${table.createdAt} + interval '7 days'`,
    ),
  ],
);
