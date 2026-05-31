-- Migration: Add bot support, sessions table, password field, and game state persistence

-- Add bot fields to room_players
ALTER TABLE room_players 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_difficulty INTEGER;

-- Add password field to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Add game state JSON for serverless persistence
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS game_state_json TEXT;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);