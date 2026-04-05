-- Emperor TCG League Database Schema
-- Run this script to set up the players table with all necessary fields

-- Create user roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create apex rank enum
DO $$ BEGIN
    CREATE TYPE apex_rank AS ENUM ('Rookie', 'Ace', 'Rival', 'Elite', 'Veteran', 'Dominator', 'Supreme', 'Apex', 'Ascended', 'Invictus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create league stage enum
DO $$ BEGIN
    CREATE TYPE league_stage AS ENUM ('pokeball_1', 'pokeball_2', 'pokeball_3', 'greatball_1', 'greatball_2', 'greatball_3', 'ultraball_1', 'ultraball_2', 'ultraball_3', 'masterball');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create trainer card design enum (for different card styles)
DO $$ BEGIN
    CREATE TYPE card_design AS ENUM ('pokeball', 'greatball', 'ultraball', 'masterball');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    trainer_name TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    
    -- Battle Points and Ranking
    bp INTEGER NOT NULL DEFAULT 0,
    apex_rank apex_rank NOT NULL DEFAULT 'Rookie',
    
    -- Stats
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    
    -- League Progress
    current_league league_stage NOT NULL DEFAULT 'pokeball_1',
    
    -- Trainer card design (which ball style)
    card_design card_design NOT NULL DEFAULT 'pokeball',
    
    -- Gym Badges stored as JSONB for flexibility
    gym_badges JSONB NOT NULL DEFAULT '{}',
    
    -- Elite Four progress
    elite_four_badges JSONB NOT NULL DEFAULT '[]',
    champion_badge BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Emperor title (nullable)
    emperor_title TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_trainer_name ON public.players(trainer_name);
CREATE INDEX IF NOT EXISTS idx_players_role ON public.players(role);
CREATE INDEX IF NOT EXISTS idx_players_bp ON public.players(bp DESC);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view players (public leaderboard)
CREATE POLICY "players_select_all" ON public.players
    FOR SELECT USING (true);

-- Users can only update their own profile (limited fields)
CREATE POLICY "players_update_own" ON public.players
    FOR UPDATE USING (auth.uid() = user_id);

-- Only authenticated users with admin/super_admin role can insert new players
-- This will be handled via server-side functions with service role key

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_players_updated_at ON public.players;
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate apex rank from BP
CREATE OR REPLACE FUNCTION calculate_apex_rank(bp_value INTEGER)
RETURNS apex_rank AS $$
BEGIN
    IF bp_value >= 10000 THEN RETURN 'Invictus';
    ELSIF bp_value >= 7000 THEN RETURN 'Ascended';
    ELSIF bp_value >= 3000 THEN RETURN 'Apex';
    ELSIF bp_value >= 2200 THEN RETURN 'Supreme';
    ELSIF bp_value >= 1500 THEN RETURN 'Dominator';
    ELSIF bp_value >= 1000 THEN RETURN 'Veteran';
    ELSIF bp_value >= 600 THEN RETURN 'Elite';
    ELSIF bp_value >= 300 THEN RETURN 'Rival';
    ELSIF bp_value >= 100 THEN RETURN 'Ace';
    ELSE RETURN 'Rookie';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate rank when BP changes
CREATE OR REPLACE FUNCTION auto_calculate_rank()
RETURNS TRIGGER AS $$
BEGIN
    NEW.apex_rank = calculate_apex_rank(NEW.bp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_rank_on_bp_change ON public.players;
CREATE TRIGGER auto_rank_on_bp_change
    BEFORE INSERT OR UPDATE OF bp ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_rank();
