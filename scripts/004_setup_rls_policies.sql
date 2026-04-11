-- This script sets up proper RLS policies after all tables exist
-- Run this AFTER 001, 002, and 003 scripts

-- ===== TRAINER CARDS RLS POLICIES =====
DROP POLICY IF EXISTS "trainer_cards_insert" ON trainer_cards;
DROP POLICY IF EXISTS "trainer_cards_update" ON trainer_cards;
DROP POLICY IF EXISTS "trainer_cards_delete" ON trainer_cards;

CREATE POLICY "trainer_cards_insert" ON trainer_cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "trainer_cards_update" ON trainer_cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "trainer_cards_delete" ON trainer_cards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ===== PLAYERS RLS POLICIES =====
DROP POLICY IF EXISTS "players_read_all" ON players;
DROP POLICY IF EXISTS "players_insert_all" ON players;
DROP POLICY IF EXISTS "players_update_all" ON players;
DROP POLICY IF EXISTS "players_delete_all" ON players;

-- Policy: Everyone can read players
CREATE POLICY "players_read" ON players
  FOR SELECT
  USING (true);

-- Policy: Only admins and super_admin can create players
CREATE POLICY "players_insert" ON players
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
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

-- Policy: Moderator can only update player stats
CREATE POLICY "players_update_moderator" ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'moderator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'moderator'
    )
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
