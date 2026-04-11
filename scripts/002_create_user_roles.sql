-- Create user_roles table - manages user permissions
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'user')),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Temporary policies - will be updated with proper super_admin checks after all tables exist
CREATE POLICY "user_roles_read_all" ON user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "user_roles_insert_all" ON user_roles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "user_roles_update_all" ON user_roles
  FOR UPDATE
  USING (true);

CREATE POLICY "user_roles_delete_all" ON user_roles
  FOR DELETE
  USING (true);

-- Note: User role assignment will be handled by application code on signup
-- This ensures the user_roles record is created after auth completes
