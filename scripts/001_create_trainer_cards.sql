-- Create trainer_cards table - stores all trainer card designs
CREATE TABLE IF NOT EXISTS trainer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '{}',
  ball_style TEXT NOT NULL CHECK (ball_style IN ('pokeball', 'greatball', 'ultraball', 'masterball')),
  top_gradient_color TEXT,
  bottom_gradient_color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on trainer_cards
ALTER TABLE trainer_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read trainer cards
CREATE POLICY "trainer_cards_select" ON trainer_cards
  FOR SELECT
  USING (is_active = true);

-- Policy: Only super admin can insert/update/delete trainer cards
-- Temporarily disabled until user_roles table exists
CREATE POLICY "trainer_cards_insert" ON trainer_cards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "trainer_cards_update" ON trainer_cards
  FOR UPDATE
  USING (true);

CREATE POLICY "trainer_cards_delete" ON trainer_cards
  FOR DELETE
  USING (true);

-- Insert default trainer cards
INSERT INTO trainer_cards (name, display_name, description, colors, ball_style, top_gradient_color, bottom_gradient_color) VALUES
(
  'pokeball',
  'Pokéball',
  'Basic trainer rank - Starting point for all players',
  '{"primaryColor":"#EF4444","secondaryColor":"#FFFFFF","accentColor":"#000000"}',
  'pokeball',
  '#EF4444',
  '#FFFFFF'
),
(
  'greatball',
  'Great Ball',
  'Intermediate trainer rank - Shows progress and dedication',
  '{"primaryColor":"#3B82F6","secondaryColor":"#EF4444","accentColor":"#FFFFFF"}',
  'greatball',
  '#3B82F6',
  '#FFFFFF'
),
(
  'ultraball',
  'Ultra Ball',
  'Advanced trainer rank - For experienced players',
  '{"primaryColor":"#A855F7","secondaryColor":"#FCD34D","accentColor":"#FFFFFF"}',
  'ultraball',
  '#A855F7',
  '#FFFFFF'
),
(
  'masterball',
  'Master Ball',
  'Elite trainer rank - The highest honor',
  '{"primaryColor":"#000000","secondaryColor":"#FCD34D","accentColor":"#FFFFFF"}',
  'masterball',
  '#1F2937',
  '#FCD34D'
)
ON CONFLICT (name) DO NOTHING;
