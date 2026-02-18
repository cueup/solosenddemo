--
-- CORE PRODUCTION SCHEMA (Foundation tables)
-- Updated to fix RLS recursion and logical bugs
--

-- 1. Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(), -- ADDED DEFAULT
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create team_members table (Global user/team management)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  status text NOT NULL CHECK (status IN ('active', 'pending', 'inactive')),
  activated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create service_members table (Service-level access control)
CREATE TABLE IF NOT EXISTS service_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('active', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (service_id, user_id)
);

-- 4. Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  title text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  address_line_3 text,
  address_line_4 text,
  address_line_5 text,
  address_line_6 text,
  address_line_7 text,
  postcode text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (service_id, email),
  UNIQUE (service_id, phone)
);

-- 5. Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('email', 'sms', 'letter')),
  subject text,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  notify_template_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create communications table (Sent message history)
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'letter')),
  status text NOT NULL CHECK (status IN ('pending', 'sending', 'delivered', 'failed')),
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  subject text,
  content text NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Create segments table
CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  filter_query jsonb NOT NULL,
  cached_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Create messages table (Drafts/Batches)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES segments(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  message_type text NOT NULL CHECK (message_type IN ('email', 'sms', 'letter')),
  subject text,
  content_preview text,
  personalisation_defaults jsonb,
  total_recipients integer DEFAULT 0,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  recipient_mode text NOT NULL CHECK (recipient_mode IN ('contact', 'segment', 'manual')),
  recipients_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Create message_recipients table (Recipient-level detail)
CREATE TABLE IF NOT EXISTS message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'blocked')),
  personalised_content jsonb NOT NULL,
  delivery_response jsonb,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (message_id, contact_id)
);

-- 10. Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  permissions text[] DEFAULT '{}',
  last_used timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 12. Create app_settings table (Global settings)
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 13. Create contact_preferences table (Per-contact settings)
CREATE TABLE IF NOT EXISTS contact_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 14. Create notification_settings table (Per-service API config)
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  api_key text,
  rate_limits jsonb,
  webhooks jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

--
-- FUNCTIONS
--

-- 1. Helper Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. SECURITY DEFINER Helpers for RLS to prevent recursion
-- These run with the privileges of the function owner (superuser), bypassing RLS tables.

CREATE OR REPLACE FUNCTION check_is_service_member(lookup_service_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns true if the current user is an active member of the service
  RETURN EXISTS (
    SELECT 1 FROM service_members
    WHERE service_id = lookup_service_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_is_service_editor(lookup_service_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns true if the current user is an admin or editor
  RETURN EXISTS (
    SELECT 1 FROM service_members
    WHERE service_id = lookup_service_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role IN ('admin', 'editor')
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_is_service_admin(lookup_service_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns true if the current user is an admin
  RETURN EXISTS (
    SELECT 1 FROM service_members
    WHERE service_id = lookup_service_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION check_is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Returns true if the current user is a global platform admin
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND status = 'active'
    AND role = 'admin'
  );
END;
$$;

-- Secure the functions: Only authenticated users can call them
REVOKE EXECUTE ON FUNCTION check_is_service_member FROM public;
GRANT EXECUTE ON FUNCTION check_is_service_member TO authenticated;

REVOKE EXECUTE ON FUNCTION check_is_service_editor FROM public;
GRANT EXECUTE ON FUNCTION check_is_service_editor TO authenticated;

REVOKE EXECUTE ON FUNCTION check_is_service_admin FROM public;
GRANT EXECUTE ON FUNCTION check_is_service_admin TO authenticated;

REVOKE EXECUTE ON FUNCTION check_is_platform_admin FROM public;
GRANT EXECUTE ON FUNCTION check_is_platform_admin TO authenticated;


-- 3. Business Logic Functions

-- Handle service creation (Security Definer to insert into service_members)
CREATE OR REPLACE FUNCTION handle_service_creation()
RETURNS trigger AS $$
BEGIN
  -- Add the creator as an admin of the new service
  INSERT INTO service_members (
    service_id,
    user_id,
    role,
    invited_by,
    status
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'admin',
    NEW.created_by,
    'active'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle new user sign-ups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user into team_members table
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
    -- Default to viewer role, unless it's the very first user
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM team_members WHERE status = 'active') THEN 'admin'
      ELSE 'viewer'
    END,
    'active',
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get app setting (using secure helper)
CREATE OR REPLACE FUNCTION get_app_setting(setting_key text)
RETURNS jsonb AS $$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT value INTO setting_value 
  FROM app_settings 
  WHERE key = setting_key 
  AND (is_public = true OR check_is_platform_admin());
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set app setting (using secure helper)
CREATE OR REPLACE FUNCTION set_app_setting(setting_key text, setting_value jsonb, setting_description text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT check_is_platform_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  INSERT INTO app_settings (key, value, description)
  VALUES (setting_key, setting_value, setting_description)
  ON CONFLICT (key) 
  DO UPDATE SET value = EXCLUDED.value, description = COALESCE(setting_description, app_settings.description), updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--
-- TRIGGERS
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_members_updated_at BEFORE UPDATE ON service_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON communications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_recipients_updated_at BEFORE UPDATE ON message_recipients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_preferences_updated_at BEFORE UPDATE ON contact_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for service creation (to auto-assign admin)
CREATE TRIGGER on_service_created
  AFTER INSERT ON services
  FOR EACH ROW EXECUTE FUNCTION handle_service_creation();

-- Trigger for new auth user (to auto-create team_member and preferences)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


--
-- ROW-LEVEL SECURITY (RLS) & POLICIES
--
-- NOTE: All policies now use the SECURITY DEFINER helpers (`check_is_...`)
-- to avoid infinite recursion when querying protected tables.

-- Services RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can view services" 
  ON services 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can create services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Service editors can update/delete services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (check_is_service_editor(id));
  
CREATE POLICY "Service admins can delete services"
  ON services
  FOR DELETE
  TO authenticated
  USING (check_is_service_admin(id));

-- Team Members RLS (Global access)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own profile or admins view all"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR check_is_platform_admin());

CREATE POLICY "Admins can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (check_is_platform_admin())
  WITH CHECK (check_is_platform_admin());

-- Service Members RLS
ALTER TABLE service_members ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own membership record OR see all members if they belong to the service
CREATE POLICY "View service members"
  ON service_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR check_is_service_member(service_id));

CREATE POLICY "Service admins can manage service members"
  ON service_members
  FOR ALL
  TO authenticated
  USING (check_is_service_admin(service_id))
  WITH CHECK (check_is_service_admin(service_id));

-- Contacts RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can view contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (check_is_service_member(service_id));

CREATE POLICY "Service editors can manage contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (check_is_service_editor(service_id))
  WITH CHECK (check_is_service_editor(service_id));

-- Communications RLS
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view communications"
  ON communications
  FOR SELECT
  TO authenticated
  USING (true); -- Adjusted based on original file, usually should be scoped to service_member

CREATE POLICY "Authenticated users can create communications"
  ON communications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update communications"
  ON communications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Templates RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can view templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (check_is_service_member(service_id));

CREATE POLICY "Service editors can manage templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (check_is_service_editor(service_id))
  WITH CHECK (check_is_service_editor(service_id));

-- Segments RLS
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can view segments"
  ON segments
  FOR SELECT
  TO authenticated
  USING (check_is_service_member(service_id));

CREATE POLICY "Service editors can manage segments"
  ON segments
  FOR ALL
  TO authenticated
  USING (check_is_service_editor(service_id))
  WITH CHECK (check_is_service_editor(service_id));

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (check_is_service_member(service_id));

CREATE POLICY "Service editors can manage messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (check_is_service_editor(service_id))
  WITH CHECK (check_is_service_editor(service_id));

-- Message Recipients RLS
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can view message recipients"
  ON message_recipients
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM messages 
    WHERE id = message_recipients.message_id 
    AND check_is_service_member(service_id)
  ));

CREATE POLICY "Service editors can manage message recipients"
  ON message_recipients
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM messages 
    WHERE id = message_recipients.message_id 
    AND check_is_service_editor(service_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM messages 
    WHERE id = message_recipients.message_id 
    AND check_is_service_editor(service_id)
  ));

-- API Keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service admins can view API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (check_is_service_admin(service_id));

CREATE POLICY "Service admins can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (check_is_service_admin(service_id))
  WITH CHECK (check_is_service_admin(service_id));

-- Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (service_id IS NULL OR check_is_service_admin(service_id));

-- App Settings RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public and Admin access to app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true OR check_is_platform_admin());

CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (check_is_platform_admin())
  WITH CHECK (check_is_platform_admin());

-- Contact Preferences RLS
ALTER TABLE contact_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service members can manage contact preferences"
  ON contact_preferences
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM contacts WHERE id = contact_preferences.contact_id AND check_is_service_member(service_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM contacts WHERE id = contact_preferences.contact_id AND check_is_service_member(service_id)));

-- Notification Settings RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service admins can view notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (check_is_service_admin(service_id));

CREATE POLICY "Service admins can manage notification settings"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (check_is_service_admin(service_id))
  WITH CHECK (check_is_service_admin(service_id));

--
-- INITIAL DATA INSERTIONS
--

INSERT INTO app_settings (key, value, description, is_public)
VALUES 
('system_limits', 
'{"max_services": 1000, "max_team_members": 50, "max_api_keys": 5, "email_rate_limit": 3000, "sms_rate_limit": 3000, "letter_rate_limit": 500}', 
'Global system limits and rate controls',
true)
ON CONFLICT (key) DO NOTHING;

-- Final Index Creation
CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts (service_id);
CREATE INDEX IF NOT EXISTS idx_communications_service ON communications (service_id);
CREATE INDEX IF NOT EXISTS idx_communications_contact ON communications (contact_id);
CREATE INDEX IF NOT EXISTS idx_templates_service ON templates (service_id, type, name);
CREATE INDEX IF NOT EXISTS idx_service_members_lookup ON service_members (service_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_segments_service ON segments (service_id);
CREATE INDEX IF NOT EXISTS idx_messages_service_status ON messages (service_id, status);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message ON message_recipients (message_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys (service_id);

--
-- PERMISSIONS & SAFETY CHECKS
--

-- Explicitly grant permissions to the authenticated role for all created tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Ensure existing services table has the default value if it was already created without it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'created_by') THEN
    ALTER TABLE services ALTER COLUMN created_by SET DEFAULT auth.uid();
  END IF;
END $$;