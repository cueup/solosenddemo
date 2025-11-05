/*
  # Create Settings and Configuration Tables

  ## Overview
  This migration creates tables for application settings, configuration,
  and system preferences needed for production deployment.

  ## New Tables

  ### `app_settings`
  Global application settings and configuration
  - System-wide preferences and limits
  - Feature flags and toggles
  - Integration settings

  ### `user_preferences`
  Per-user preferences and settings
  - UI preferences and customisation
  - Notification preferences
  - Dashboard configuration

  ### `notification_settings`
  GOV.UK Notify service configuration
  - API keys and service settings
  - Rate limiting and quotas
  - Service-specific templates

  ## Security
  - RLS enabled with appropriate access controls
  - Sensitive settings restricted to admins
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  api_key_encrypted text,
  base_url text DEFAULT 'https://api.notifications.service.gov.uk',
  rate_limit_per_minute integer DEFAULT 3000,
  daily_limit integer,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_public ON app_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_service ON notification_settings(service_name);
CREATE INDEX IF NOT EXISTS idx_notification_settings_active ON notification_settings(is_active);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- App settings policies
CREATE POLICY "Anyone can view public settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can view all settings"
  ON app_settings
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

CREATE POLICY "Admins can manage settings"
  ON app_settings
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

-- User preferences policies
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification settings policies
CREATE POLICY "Admins can manage notification settings"
  ON notification_settings
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

-- Create triggers
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO app_settings (key, value, description, is_public) VALUES
('app_name', '"GOV.UK Notify Dashboard"', 'Application name displayed in UI', true),
('max_recipients_per_message', '50000', 'Maximum number of recipients per message', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', false),
('allowed_file_types', '["csv", "xlsx", "txt"]', 'Allowed file types for contact imports', true),
('rate_limit_per_user_per_hour', '1000', 'API rate limit per user per hour', false),
('maintenance_mode', 'false', 'Enable maintenance mode', true),
('feature_flags', '{"segments": true, "scheduling": true, "templates": true, "audit_logs": true}', 'Feature flags for the application', false),
('contact_import_batch_size', '1000', 'Batch size for contact imports', false),
('message_retention_days', '365', 'Number of days to retain message data', false),
('audit_log_retention_days', '2555', 'Number of days to retain audit logs (7 years)', false)
ON CONFLICT (key) DO NOTHING;

-- Insert default notification service settings
INSERT INTO notification_settings (service_name, settings) VALUES
('govuk_notify', '{
  "email_rate_limit": 3000,
  "sms_rate_limit": 3000,
  "letter_rate_limit": 500,
  "test_mode": false,
  "webhook_url": null,
  "callback_bearer_token": null
}')
ON CONFLICT DO NOTHING;

-- Create function to get app setting
CREATE OR REPLACE FUNCTION get_app_setting(setting_key text)
RETURNS jsonb AS $$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT value INTO setting_value 
  FROM app_settings 
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set app setting (admin only)
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
  DO UPDATE SET 
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, app_settings.description),
    updated_at = now();
    
  -- Log the change
  PERFORM log_audit_event(
    'setting_updated',
    'app_settings',
    NULL,
    NULL,
    jsonb_build_object('key', setting_key, 'value', setting_value)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
