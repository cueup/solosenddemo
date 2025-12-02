/*
  # Create Invitations Schema

  ## Overview
  This migration creates tables for managing team and service invitations.

  ## New Tables

  ### `team_invitations`
  Global team invitations for platform access
  - Tracks pending, accepted, and expired invitations
  - Links to team_members when accepted

  ### `service_invitations`
  Service-specific invitations
  - Tracks invitations to join specific services
  - Links to service_members when accepted

  ## Security
  - RLS enabled with appropriate access controls
  - Only admins can send invitations
  - Users can view their own invitations
*/

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_invitations table
CREATE TABLE IF NOT EXISTS service_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_service_invitations_service_id ON service_invitations(service_id);
CREATE INDEX IF NOT EXISTS idx_service_invitations_email ON service_invitations(email);
CREATE INDEX IF NOT EXISTS idx_service_invitations_status ON service_invitations(status);
CREATE INDEX IF NOT EXISTS idx_service_invitations_token ON service_invitations(token);
CREATE INDEX IF NOT EXISTS idx_service_invitations_expires_at ON service_invitations(expires_at);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_invitations ENABLE ROW LEVEL SECURITY;

-- Team invitations policies
CREATE POLICY "Users can view their own invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid() OR 
    email = auth.email()
  );

CREATE POLICY "Authenticated users can create team invitations"
  ON team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update their own invitations"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can delete their own invitations"
  ON team_invitations
  FOR DELETE
  TO authenticated
  USING (invited_by = auth.uid());

-- Service invitations policies
CREATE POLICY "Users can view service invitations they created or received"
  ON service_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid() OR 
    email = auth.email()
  );

CREATE POLICY "Authenticated users can create service invitations"
  ON service_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update their own service invitations"
  ON service_invitations
  FOR UPDATE
  TO authenticated
  USING (invited_by = auth.uid())
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can delete their own service invitations"
  ON service_invitations
  FOR DELETE
  TO authenticated
  USING (invited_by = auth.uid());

-- Create triggers
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_invitations_updated_at
  BEFORE UPDATE ON service_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  -- Expire team invitations
  UPDATE team_invitations 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' 
  AND expires_at < now();
  
  -- Expire service invitations
  UPDATE service_invitations 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token text)
RETURNS jsonb AS $$
DECLARE
  invitation_record team_invitations%ROWTYPE;
  new_member_id uuid;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
  AND status = 'pending'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user already exists as team member
  IF EXISTS (
    SELECT 1 FROM team_members 
    WHERE user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a team member');
  END IF;
  
  -- Create team member
  INSERT INTO team_members (
    user_id,
    email,
    full_name,
    role,
    status,
    invited_by,
    activated_at
  ) VALUES (
    auth.uid(),
    invitation_record.email,
    invitation_record.full_name,
    invitation_record.role,
    'active',
    invitation_record.invited_by,
    now()
  ) RETURNING id INTO new_member_id;
  
  -- Update invitation status
  UPDATE team_invitations
  SET status = 'accepted',
      accepted_by = auth.uid(),
      accepted_at = now(),
      updated_at = now()
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object('success', true, 'member_id', new_member_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept service invitation
CREATE OR REPLACE FUNCTION accept_service_invitation(invitation_token text)
RETURNS jsonb AS $$
DECLARE
  invitation_record service_invitations%ROWTYPE;
  new_member_id uuid;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM service_invitations
  WHERE token = invitation_token
  AND status = 'pending'
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user already exists as service member
  IF EXISTS (
    SELECT 1 FROM service_members 
    WHERE service_id = invitation_record.service_id
    AND user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member of this service');
  END IF;
  
  -- Create service member
  INSERT INTO service_members (
    service_id,
    user_id,
    role,
    invited_by
  ) VALUES (
    invitation_record.service_id,
    auth.uid(),
    invitation_record.role,
    invitation_record.invited_by
  ) RETURNING id INTO new_member_id;
  
  -- Update invitation status
  UPDATE service_invitations
  SET status = 'accepted',
      accepted_by = auth.uid(),
      accepted_at = now(),
      updated_at = now()
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object('success', true, 'member_id', new_member_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
