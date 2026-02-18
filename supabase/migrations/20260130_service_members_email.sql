-- Migration to support email-based service invitations
-- 1. Add email column to service_members
-- 2. Allow user_id to be NULL (for pending invites)
-- 3. Add constraints for validity

-- Enable RLS (just in case)
ALTER TABLE service_members ENABLE ROW LEVEL SECURITY;

-- 1. Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_members' AND column_name = 'email') THEN
    ALTER TABLE service_members ADD COLUMN email text;
  END IF;
END $$;

-- 2. Modify user_id to be nullable
ALTER TABLE service_members ALTER COLUMN user_id DROP NOT NULL;

-- 3. Validation Constraints
-- Ensure we have either a user_id or an email
ALTER TABLE service_members DROP CONSTRAINT IF EXISTS service_members_identity_check;
ALTER TABLE service_members ADD CONSTRAINT service_members_identity_check 
  CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Ensure uniqueness for emails within a service (for pending invites)
-- We already have UNIQUE(service_id, user_id).
-- We need something to prevent duplicate invites for the same email in the same service.
DROP INDEX IF EXISTS idx_service_members_service_email;
CREATE UNIQUE INDEX idx_service_members_service_email ON service_members (service_id, email) WHERE email IS NOT NULL;


-- 4. Update handle_new_user trigger to link pending service memberships
-- When a user signs up, any service_members rows with their email should update to allow the user access.

CREATE OR REPLACE FUNCTION handle_new_user_services()
RETURNS trigger AS $$
BEGIN
  -- Update pending service memberships that match this email
  UPDATE service_members
  SET 
    user_id = NEW.id,
    status = 'active'
    -- Note: We keep the email column populated even after linking, 
    -- or we could NULL it if we only want it for pending. 
    -- keeping it seems safer for audit/visibility.
  WHERE 
    email = NEW.email 
    AND user_id IS NULL;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_services ON auth.users;
CREATE TRIGGER on_auth_user_created_services
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_services();
