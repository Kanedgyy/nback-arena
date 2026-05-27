import { pgTable, uuid, varchar, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (extended from better-auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Game rooms
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  hostId: uuid('host_id').notNull().references(() => users.id),
  nValue: integer('n_value').notNull().default(2),
  maxPlayers: integer('max_players').notNull().default(4),
  isStarted: boolean('is_started').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Room players (join table)
export const roomPlayers = pgTable('room_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0),
  mistakes: integer('mistakes').notNull().default(0),
  isReady: boolean('is_ready').notNull().default(false),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Game results
export const gameResults = pgTable('game_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  mistakes: integer('mistakes').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  finalSpeed: integer('final_speed').notNull(),
  rank: integer('rank'),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  roomPlayers: many(roomPlayers),
  gameResults: many(gameResults),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  roomPlayers: many(roomPlayers),
  gameResults: many(gameResults),
}));

export const roomPlayersRelations = relations(roomPlayers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomPlayers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomPlayers.userId],
    references: [users.id],
  }),
}));

export const gameResultsRelations = relations(gameResults, ({ one }) => ({
  room: one(rooms, {
    fields: [gameResults.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [gameResults.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type RoomPlayer = typeof roomPlayers.$inferSelect;
export type NewRoomPlayer = typeof roomPlayers.$inferInsert;
export type GameResult = typeof gameResults.$inferSelect;
export type NewGameResult = typeof gameResults.$inferInsert;
