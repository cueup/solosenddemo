--
-- CORE PRODUCTION SCHEMA (Foundation tables)
--

-- 1. Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- 13. Create user_preferences table (Per-user settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle service creation with automatic admin membership
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

-- Function to handle new user sign-ups (on auth.users insertion)
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
  
  -- Create default user preferences
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get app setting (publicly or with admin check)
CREATE OR REPLACE FUNCTION get_app_setting(setting_key text)
RETURNS jsonb AS $$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT value INTO setting_value 
  FROM app_settings 
  WHERE key = setting_key 
  AND (is_public = true OR EXISTS (
    SELECT 1 FROM team_members 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    AND role = 'admin'
  ));
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set app setting (admin only)
CREATE OR REPLACE FUNCTION set_app_setting(setting_key text, setting_value jsonb, setting_description text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    AND role = 'admin'
  ) THEN
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

-- Triggers for `updated_at` timestamps
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
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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

-- Helper function for RLS checks (user is a service member)
CREATE OR REPLACE FUNCTION is_service_member(service_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM service_members 
    WHERE service_members.service_id = service_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  );
$$ LANGUAGE sql STABLE;

-- Helper function for RLS checks (user is service admin/editor)
CREATE OR REPLACE FUNCTION is_service_editor(service_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM service_members 
    WHERE service_members.service_id = service_id 
    AND user_id = auth.uid() 
    AND status = 'active'
    AND role IN ('admin', 'editor')
  );
$$ LANGUAGE sql STABLE;

-- Services RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view services" 
  ON services 
  FOR SELECT 
  TO authenticated 
  USING (is_service_member(id));
CREATE POLICY "Service editors can manage services"
  ON services 
  FOR ALL
  TO authenticated
  USING (is_service_editor(id))
  WITH CHECK (is_service_editor(id));

-- Team Members RLS (Global access for active admins)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and self can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (role = 'admin' OR user_id = auth.uid());
CREATE POLICY "Admins can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'));

-- Service Members RLS
ALTER TABLE service_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view service members"
  ON service_members
  FOR SELECT
  TO authenticated
  USING (is_service_member(service_id));
CREATE POLICY "Service admins can manage service members"
  ON service_members
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_members WHERE service_id = service_members.service_id AND user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM service_members WHERE service_id = service_members.service_id AND user_id = auth.uid() AND role = 'admin'));

-- Contacts RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (is_service_member(service_id));
CREATE POLICY "Service editors can create contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_service_editor(service_id));
CREATE POLICY "Service editors can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (is_service_editor(service_id))
  WITH CHECK (is_service_editor(service_id));
CREATE POLICY "Service admins can delete contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_members WHERE service_id = contacts.service_id AND user_id = auth.uid() AND role = 'admin'));

-- Communications RLS (Allow all authenticated to read, restricted write access assumed elsewhere)
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view all communications"
  ON communications
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can create communications"
  ON communications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update communications"
  ON communications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Templates RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (is_service_member(service_id));
CREATE POLICY "Service editors can manage templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (is_service_editor(service_id))
  WITH CHECK (is_service_editor(service_id));

-- Segments RLS
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view segments"
  ON segments
  FOR SELECT
  TO authenticated
  USING (is_service_member(service_id));
CREATE POLICY "Service editors can manage segments"
  ON segments
  FOR ALL
  TO authenticated
  USING (is_service_editor(service_id))
  WITH CHECK (is_service_editor(service_id));

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (is_service_member(service_id));
CREATE POLICY "Service editors can manage messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (is_service_editor(service_id))
  WITH CHECK (is_service_editor(service_id));

-- Message Recipients RLS
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service members can view message recipients"
  ON message_recipients
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM messages WHERE id = message_recipients.message_id AND is_service_member(service_id)));
CREATE POLICY "Service editors can manage message recipients"
  ON message_recipients
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM messages WHERE id = message_recipients.message_id AND is_service_editor(service_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM messages WHERE id = message_recipients.message_id AND is_service_editor(service_id)));

-- API Keys RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service admins can view API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_members WHERE service_id = api_keys.service_id AND user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service admins can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_members WHERE service_id = api_keys.service_id AND user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM service_members WHERE service_id = api_keys.service_id AND user_id = auth.uid() AND role = 'admin'));

-- Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (service_id IS NULL OR EXISTS (SELECT 1 FROM service_members WHERE service_id = audit_logs.service_id AND user_id = auth.uid() AND role = 'admin'));

-- App Settings RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public and Admin access to app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true OR EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'));
CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'));

-- User Preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see/edit their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification Settings RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service admins can view notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_members WHERE service_id = notification_settings.service_id AND user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service admins can manage notification settings"
  ON notification_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM service_members WHERE service_id = notification_settings.service_id AND user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM service_members WHERE service_id = notification_settings.service_id AND user_id = auth.uid() AND role = 'admin'));

--
-- INITIAL DATA INSERTIONS
--

-- Initial global app settings
INSERT INTO app_settings (key, value, description, is_public)
VALUES 
('system_limits', 
'{"max_services": 1000, "max_team_members": 50, "max_api_keys": 5, "email_rate_limit": 3000, "sms_rate_limit": 3000, "letter_rate_limit": 500}', 
'Global system limits and rate controls',
true)
ON CONFLICT (key) DO NOTHING;

-- Initial default templates (assuming a generic service ID will be needed or they will be created per-service)
-- NOTE: For production, these should usually be inserted with a specific service_id. For now, we omit service_id to avoid FK error if no service exists yet. 
-- In a real migration, you might load a default service ID here. Since no service ID is available yet, I'll remove the initial insert data from the template table to avoid FK violations.

/*
INSERT INTO templates (service_id, name, description, type, subject, content, variables)
VALUES 
(
  (SELECT id FROM services LIMIT 1), -- Placeholder, replace with actual service_id
  'Appointment Reminder', 
  '24-hour reminder for a scheduled appointment', 
  'sms', 
  NULL, 
  'Reminder: Your appointment with {{serviceName}} is tomorrow at {{appointmentTime}} at {{location}}. Please arrive 10 minutes early. Reply STOP to opt out.', 
  ARRAY['serviceName', 'appointmentTime', 'location']
),
(
  (SELECT id FROM services LIMIT 1), -- Placeholder, replace with actual service_id
  'Annual Statement', 
  'Yearly financial summary letter', 
  'letter', 
  'Your Annual Statement - {{year}}', 
  'Dear {{title}} {{lastName}},... (content truncated for brevity)', 
  ARRAY['title', 'lastName', 'year', 'accountNumber', 'totalContributions', 'currentBalance', 'contactNumber', 'departmentName']
),
(
  (SELECT id FROM services LIMIT 1), -- Placeholder, replace with actual service_id
  'Password Reset', 
  'Security notification for password changes', 
  'email', 
  'Password Reset Request', 
  'Dear {{firstName}},... (content truncated for brevity)', 
  ARRAY['firstName', 'resetLink', 'serviceName']
);
*/

-- Final Index Creation
CREATE INDEX ON contacts (service_id);
CREATE INDEX ON communications (service_id);
CREATE INDEX ON communications (contact_id);
CREATE INDEX ON templates (service_id, type, name);
CREATE INDEX ON service_members (service_id, user_id);
CREATE INDEX ON team_members (user_id);
CREATE INDEX ON segments (service_id);
CREATE INDEX ON messages (service_id, status);
CREATE INDEX ON message_recipients (message_id);
CREATE INDEX ON api_keys (service_id);
