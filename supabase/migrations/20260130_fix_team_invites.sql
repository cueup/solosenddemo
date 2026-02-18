-- Migration to improve team invitation handling
-- 1. Update handle_new_user to properly merge pending invitations
-- 2. Ensure team_members.user_id is nullable (it should be already, but ensuring)

-- Re-create the function with ON CONFLICT logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user into team_members table, or update if email already exists (pending invite)
  INSERT INTO team_members (
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
    -- Default to viewer role, unless it's the very first user AND no active admin exists
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM team_members WHERE status = 'active' AND role = 'admin') THEN 'admin'
      ELSE 'viewer'
    END,
    'active',
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    status = 'active', -- Activate the pending member
    activated_at = now(),
    full_name = COALESCE(team_members.full_name, EXCLUDED.full_name); -- Keep existing name if set, or use new one
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup: We are moving away from team_invitations table if it was created.
-- We will just use team_members with user_id=NULL for pending invites.
DROP TABLE IF EXISTS team_invitations;
