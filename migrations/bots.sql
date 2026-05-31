-- Add bot fields to room_players table
ALTER TABLE room_players 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_difficulty INTEGER;
