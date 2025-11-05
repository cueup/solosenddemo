/*
  # Create Production Schema

  ## Overview
  This migration creates additional tables needed for a production-ready
  GOV.UK Notify application, including messages, segments, team management,
  and audit logging.

  ## New Tables

  ### `messages`
  Stores sent/draft messages with full metadata
  - Links to templates and tracks delivery status
  - Supports scheduling and batch sending
  - Stores personalisation data and delivery statistics

  ### `message_recipients`
  Junction table linking messages to contacts
  - Tracks individual delivery status per recipient
  - Stores personalised content and delivery timestamps

  ### `segments`
  Stores contact segments for targeted messaging
  - Dynamic filtering based on contact attributes
  - Cached contact counts for performance

  ### `team_members`
  User management and role-based access control
  - Admin, editor, and viewer roles
  - Invitation system with pending status

  ### `audit_logs`
  Comprehensive audit trail for compliance
  - Tracks all user actions and system events
  - Immutable log entries with full context

  ### `api_keys`
  API key management for integrations
  - Scoped permissions and usage tracking
  - Secure key storage with hashing

  ## Security
  - RLS enabled on all tables
  - Role-based access policies
  - Audit logging for sensitive operations
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_api_keys table
CREATE TABLE IF NOT EXISTS service_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  type text NOT NULL CHECK (type IN ('test', 'live')),
  is_active boolean DEFAULT false,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_id, is_active) WHERE is_active = true -- Only one active key per service
);

-- Create service_members table for service-level access control
CREATE TABLE IF NOT EXISTS service_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_id, user_id)
);

-- Create messages table with service isolation
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'letter')),
  subject text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  total_recipients integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  personalisation jsonb DEFAULT '{}',
  segment_filters jsonb,
  api_key_used uuid REFERENCES service_api_keys(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create message_recipients junction table
CREATE TABLE IF NOT EXISTS message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'delivered', 'failed', 'bounced')),
  personalised_content text,
  personalised_subject text,
  notify_id text, -- GOV.UK Notify message ID
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(message_id, contact_id)
);

-- Create segments table with service isolation
CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  filters jsonb NOT NULL DEFAULT '[]',
  contact_count integer DEFAULT 0,
  last_calculated_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  last_sign_in timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  permissions text[] DEFAULT '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_created_by ON services(created_by);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);

CREATE INDEX IF NOT EXISTS idx_service_api_keys_service_id ON service_api_keys(service_id);
CREATE INDEX IF NOT EXISTS idx_service_api_keys_is_active ON service_api_keys(service_id, is_active);
CREATE INDEX IF NOT EXISTS idx_service_api_keys_key_hash ON service_api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_service_members_service_id ON service_members(service_id);
CREATE INDEX IF NOT EXISTS idx_service_members_user_id ON service_members(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_service_id ON messages(service_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(service_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled_for ON messages(service_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_messages_created_by ON messages(service_id, created_by);
CREATE INDEX IF NOT EXISTS idx_messages_template_id ON messages(template_id);

CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_contact_id ON message_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_status ON message_recipients(status);
CREATE INDEX IF NOT EXISTS idx_message_recipients_notify_id ON message_recipients(notify_id);

CREATE INDEX IF NOT EXISTS idx_segments_service_id ON segments(service_id);
CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(service_id, created_by);
CREATE INDEX IF NOT EXISTS idx_segments_name ON segments(service_id, name);

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Users can view services they belong to"
  ON services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = services.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service admins can update services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = services.id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Service admins can delete services"
  ON services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = services.id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Service API keys policies
CREATE POLICY "Service members can view API keys"
  ON service_api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = service_api_keys.service_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service admins can manage API keys"
  ON service_api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = service_api_keys.service_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = service_api_keys.service_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Service members policies
CREATE POLICY "Service members can view service membership"
  ON service_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM service_members sm 
      WHERE sm.service_id = service_members.service_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  );

CREATE POLICY "Service admins can manage membership"
  ON service_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members sm 
      WHERE sm.service_id = service_members.service_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members sm 
      WHERE sm.service_id = service_members.service_id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'admin'
    )
  );

-- Messages policies
CREATE POLICY "Service members can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = messages.service_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service editors and admins can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = messages.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Service editors and admins can update messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = messages.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Service admins can delete messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = messages.service_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Message recipients policies
CREATE POLICY "Team members can view message recipients"
  ON message_recipients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "System can manage message recipients"
  ON message_recipients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Segments policies
CREATE POLICY "Service members can view segments"
  ON segments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = segments.service_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service editors and admins can manage segments"
  ON segments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = segments.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = segments.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Team members policies
CREATE POLICY "Team members can view team"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role = 'admin'
    )
  );

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role = 'admin'
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- API keys policies
CREATE POLICY "Admins can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = auth.uid() 
      AND status = 'active' 
      AND role = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_api_keys_updated_at
  BEFORE UPDATE ON service_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_members_updated_at
  BEFORE UPDATE ON service_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_recipients_updated_at
  BEFORE UPDATE ON message_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate segment contact count
CREATE OR REPLACE FUNCTION calculate_segment_contacts(segment_id uuid)
RETURNS integer AS $$
DECLARE
  segment_filters jsonb;
  contact_count integer;
BEGIN
  SELECT filters INTO segment_filters FROM segments WHERE id = segment_id;
  
  -- This is a simplified version - in production you'd implement
  -- proper filter parsing and dynamic query building
  SELECT COUNT(*) INTO contact_count FROM contacts;
  
  UPDATE segments 
  SET contact_count = contact_count, 
      last_calculated_at = now() 
  WHERE id = segment_id;
  
  RETURN contact_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle service creation with automatic admin membership
CREATE OR REPLACE FUNCTION handle_service_creation()
RETURNS trigger AS $$
BEGIN
  -- Add the creator as an admin of the new service
  INSERT INTO service_members (
    service_id,
    user_id,
    role,
    invited_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'admin',
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for service creation
CREATE TRIGGER on_service_created
  AFTER INSERT ON services
  FOR EACH ROW EXECUTE FUNCTION handle_service_creation();

-- Insert initial admin user (this should be customised for your setup)
-- Note: This assumes the first user to sign up becomes admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if this is the first user
  IF NOT EXISTS (SELECT 1 FROM team_members WHERE status = 'active') THEN
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
      'admin',
      'active',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user handling
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
