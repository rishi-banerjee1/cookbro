import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';
export const households=sqliteTable('households',{userId:text('user_id').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()});
