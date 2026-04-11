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

-- Policy: Admins and moderators can read all players
CREATE POLICY "players_read_admins" ON players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator', 'super_admin')
    )
  );

-- Policy: Users can read their own player profile
CREATE POLICY "players_read_own" ON players
  FOR SELECT
  USING (auth.uid() = created_by);

-- Policy: Admins and super admin can create players
CREATE POLICY "players_insert" ON players
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Super admin can update any player
CREATE POLICY "players_update_super_admin" ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy: Admin can update players they created
CREATE POLICY "players_update_admin" ON players
  FOR UPDATE
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Moderator can only update player stats (wins, losses, streak, bp)
CREATE POLICY "players_update_moderator" ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'moderator'
    )
  )
  WITH CHECK (
    -- Moderators can only change stats, not trainer_card_id or rank
    (SELECT name FROM trainer_cards WHERE id = trainer_card_id) = 
    (SELECT name FROM trainer_cards WHERE id = (
      SELECT trainer_card_id FROM players 
      WHERE id = players.id
    ))
  );

-- Policy: Super admin can delete any player
CREATE POLICY "players_delete_super_admin" ON players
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy: Admin can delete players they created
CREATE POLICY "players_delete_admin" ON players
  FOR DELETE
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
