-- Consolidation of team_members and service_members
-- 1. Rename team_members to profiles
ALTER TABLE team_members RENAME TO profiles;

-- 2. Add full_name to service_members
ALTER TABLE service_members ADD COLUMN IF NOT EXISTS full_name text;

-- 3. Migrate names from profiles (formerly team_members) to service_members where missing
UPDATE service_members sm
SET full_name = p.full_name
FROM profiles p
WHERE sm.email = p.email OR sm.user_id = p.user_id
AND sm.full_name IS NULL;

-- 4. Update check_is_platform_admin function
CREATE OR REPLACE FUNCTION check_is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns true if the current user is a global platform admin in the profiles table
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND role = 'admin'
  );
END;
$$;

-- 5. Update handle_new_user function (Trigger on auth.users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user into profiles table (formerly team_members)
  INSERT INTO profiles (
    user_id,
    email,
    full_name,
    role,
    status,
    activated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    -- Default to viewer role, unless it's the very first user
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE status = 'active') THEN 'admin'
      ELSE 'viewer'
    END,
    'active',
    now()
  );
  
  -- Also link any pending service memberships
  UPDATE service_members
  SET 
    user_id = NEW.id,
    status = 'active',
    full_name = COALESCE(full_name, NEW.raw_user_meta_data->>'full_name')
  WHERE 
    email = NEW.email 
    AND (user_id IS NULL OR status = 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Clean up old triggers/functions from 20260130_service_members_email.sql if they exist
-- We merged handle_new_user_services logic into handle_new_user above.
DROP TRIGGER IF EXISTS on_auth_user_created_services ON auth.users;
-- Note: handle_new_user trigger (on_auth_user_created) already exists in 17012026_Updated_Schema.sql

-- 7. Update RLS on profiles (formerly team_members)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own profile or admins view all" ON profiles;
CREATE POLICY "View own profile or admins view all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR check_is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage team members" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (check_is_platform_admin())
  WITH CHECK (check_is_platform_admin());
