import { pgTable, uuid, varchar, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (for better-auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  name: varchar('name', { length: 255 }),
  image: varchar('image', { length: 255 }),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table (for better-auth)
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: varchar('user_agent', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Accounts table (for better-auth social providers)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Verifications table (for better-auth)
export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Game rooms
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  hostId: uuid('host_id').defaultRandom(),
  nValue: integer('n_value').notNull().default(2),
  maxPlayers: integer('max_players').notNull().default(4),
  isStarted: boolean('is_started').notNull().default(false),
  isTournament: boolean('is_tournament').notNull().default(false),
  tournamentRound: integer('tournament_round').notNull().default(0),
  tournamentTotalRounds: integer('tournament_total_rounds').notNull().default(3),
  tournamentResultsJson: text('tournament_results_json'), // [{round:1, nValue:1, players:[{userId, score, mistakes}]}]
  gameStateJson: text('game_state_json'), // Serialized room state for serverless persistence
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Room players (join table)
export const roomPlayers = pgTable('room_players', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  score: integer('score').notNull().default(0),
  mistakes: integer('mistakes').notNull().default(0),
  isReady: boolean('is_ready').notNull().default(false),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isBot: boolean('is_bot').notNull().default(false),
  botDifficulty: integer('bot_difficulty'), // 1=Easy, 2=Medium, 3=Hard (only for bots)
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
  sessions: many(sessions),
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
  // Bot info would be here if we had a separate bots table
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

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const verificationsRelations = relations(verifications, ({}) => ({}));

// Type exports - using explicit interfaces for better TypeScript compatibility
export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  id?: string;
  email: string;
  name?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Room {
  id: string;
  name: string;
  hostId: string | null;
  nValue: number;
  maxPlayers: number;
  isStarted: boolean;
  isTournament: boolean;
  tournamentRound: number;
  tournamentTotalRounds: number;
  tournamentResultsJson: string | null;
  gameStateJson: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRoom {
  id?: string;
  name: string;
  hostId?: string | null;
  nValue?: number;
  maxPlayers?: number;
  isStarted?: boolean;
  isTournament?: boolean;
  tournamentRound?: number;
  tournamentTotalRounds?: number;
  tournamentResultsJson?: string | null;
  gameStateJson?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoomPlayer {
  id: string;
  roomId: string;
  userId: string;
  score: number;
  mistakes: number;
  isReady: boolean;
  joinedAt: Date;
  isBot: boolean;
  botDifficulty: number | null;
}

export interface NewRoomPlayer {
  id?: string;
  roomId: string;
  userId: string;
  score?: number;
  mistakes?: number;
  isReady?: boolean;
  joinedAt?: Date;
  isBot?: boolean;
  botDifficulty?: number | null;
}

export interface GameResult {
  id: string;
  roomId: string;
  userId: string;
  score: number;
  mistakes: number;
  correctAnswers: number;
  finalSpeed: number;
  rank: number | null;
  completedAt: Date;
}

export interface NewGameResult {
  id?: string;
  roomId: string;
  userId: string;
  score: number;
  mistakes: number;
  correctAnswers: number;
  finalSpeed: number;
  rank?: number | null;
  completedAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface NewSession {
  id?: string;
  userId: string;
  expiresAt: Date;
  createdAt?: Date;
}

