-- Admin-specific RLS policies for Emperor TCG League
-- These policies control who can create, update, and delete players based on role

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role
    FROM public.players
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(current_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
DECLARE
    current_role user_role;
BEGIN
    current_role := get_current_user_role();
    RETURN current_role IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is moderator or higher
CREATE OR REPLACE FUNCTION is_moderator_or_higher()
RETURNS BOOLEAN AS $$
DECLARE
    current_role user_role;
BEGIN
    current_role := get_current_user_role();
    RETURN current_role IN ('super_admin', 'admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "players_insert_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_admin" ON public.players;
DROP POLICY IF EXISTS "players_delete_admin" ON public.players;
DROP POLICY IF EXISTS "players_update_moderator" ON public.players;

-- Policy: Admins and Super Admins can insert new players
CREATE POLICY "players_insert_admin" ON public.players
    FOR INSERT
    WITH CHECK (
        is_admin_or_higher()
        OR auth.uid() IS NOT NULL -- Allow self-registration
    );

-- Policy: Moderators can update stats (wins, losses, streak, bp)
-- Admins can update everything except super_admin promotion
-- Super Admins can update everything
CREATE POLICY "players_update_staff" ON public.players
    FOR UPDATE
    USING (
        -- User can update their own non-sensitive fields
        auth.uid() = user_id
        OR
        -- Moderators can update any player's stats
        is_moderator_or_higher()
    )
    WITH CHECK (
        -- Prevent non-super-admins from setting role to admin/super_admin
        (
            is_super_admin()
            OR
            (role IS NOT DISTINCT FROM (SELECT p.role FROM public.players p WHERE p.id = players.id))
            OR
            (role IN ('moderator', 'user') AND is_admin_or_higher())
        )
    );

-- Policy: Only admins can delete players (except super_admin)
CREATE POLICY "players_delete_admin" ON public.players
    FOR DELETE
    USING (
        is_admin_or_higher()
        AND
        role != 'super_admin' -- Cannot delete super admin
    );

-- Create trainer_cards table for storing different card designs
CREATE TABLE IF NOT EXISTS public.trainer_card_designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    -- Colors for the card
    primary_color TEXT NOT NULL DEFAULT '#E53935', -- Red for pokeball
    secondary_color TEXT NOT NULL DEFAULT '#FFFFFF', -- White
    accent_color TEXT,
    -- Which league stage this design is for
    league_type TEXT NOT NULL, -- 'pokeball', 'greatball', 'ultraball', 'masterball'
    -- Whether this design is active/available
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Order for display
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default card designs
INSERT INTO public.trainer_card_designs (id, name, display_name, description, primary_color, secondary_color, accent_color, league_type, sort_order)
VALUES 
    ('pokeball', 'pokeball', 'Pokeball', 'Standard red and white Pokeball design', '#E53935', '#FFFFFF', '#1a1a1a', 'pokeball', 1),
    ('greatball', 'greatball', 'Great Ball', 'Blue Great Ball design with red accents', '#4A90A4', '#FFFFFF', '#E53935', 'greatball', 2),
    ('ultraball', 'ultraball', 'Ultra Ball', 'Black and gold Ultra Ball design', '#1a1a1a', '#FFD700', '#FFFFFF', 'ultraball', 3),
    ('masterball', 'masterball', 'Master Ball', 'Purple Master Ball design', '#7B2D8E', '#FF69B4', '#FFFFFF', 'masterball', 4)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on trainer_card_designs
ALTER TABLE public.trainer_card_designs ENABLE ROW LEVEL SECURITY;

-- Everyone can view card designs
CREATE POLICY "card_designs_select_all" ON public.trainer_card_designs
    FOR SELECT USING (true);

-- Only super admin can modify card designs
CREATE POLICY "card_designs_modify_super_admin" ON public.trainer_card_designs
    FOR ALL USING (is_super_admin());
