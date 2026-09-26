import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';
export const households=sqliteTable('households',{userId:text('user_id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()});

export const deviceLinks=sqliteTable('device_links',{tokenHash:text('token_hash').primaryKey(),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull(),redeemedAt:integer('redeemed_at')});
export const deviceSessions=sqliteTable('device_sessions',{tokenHash:text('token_hash').primaryKey(),label:text('label').notNull(),createdAt:integer('created_at').notNull(),expiresAt:integer('expires_at').notNull()});
