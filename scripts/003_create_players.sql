-- Create players table - stores player profile and stats
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wins INTEGER DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER DEFAULT 0 CHECK (losses >= 0),
  streak INTEGER DEFAULT 0,
  bp INTEGER DEFAULT 0 CHECK (bp >= 0),
  trainer_card_id UUID NOT NULL REFERENCES trainer_cards(id),
  rank TEXT NOT NULL DEFAULT 'pokeball',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_players_created_by ON players(created_by);
CREATE INDEX IF NOT EXISTS idx_players_trainer_card_id ON players(trainer_card_id);
CREATE INDEX IF NOT EXISTS idx_players_bp ON players(bp DESC);
CREATE INDEX IF NOT EXISTS idx_players_rank ON players(rank);

-- Enable RLS on players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Basic policies - will be updated after user_roles is properly set up
CREATE POLICY "players_read_all" ON players
  FOR SELECT
  USING (true);

CREATE POLICY "players_insert_all" ON players
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "players_update_all" ON players
  FOR UPDATE
  USING (true);

CREATE POLICY "players_delete_all" ON players
  FOR DELETE
  USING (true);
