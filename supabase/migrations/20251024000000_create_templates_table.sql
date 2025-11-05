/*
  # Create Templates Table

  ## Overview
  This migration creates the templates table for storing reusable message templates
  with variable substitution support.

  ## New Table

  ### `templates`
  Stores message templates for emails, SMS, and letters.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Template name for identification
  - `description` (text) - Template description
  - `type` (text) - Template type: email, sms, or letter
  - `subject` (text, nullable) - Subject line (for emails and letters)
  - `content` (text) - Template content with variable placeholders
  - `variables` (text[], array) - List of variables used in the template
  - `notify_template_id` (text, nullable) - GOV.UK Notify template ID if linked
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled for data protection
  - Authenticated users can manage all templates

  ## Indexes
  - Template lookups by type and name
*/

-- Create templates table with service isolation
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
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_service_id ON templates(service_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(service_id, type);
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(service_id, name);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(service_id, is_active);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(service_id, created_by);
CREATE INDEX IF NOT EXISTS idx_templates_notify_id ON templates(notify_template_id);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Service members can view active templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = templates.service_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service editors and admins can create templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = templates.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Service editors and admins can update templates"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = templates.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = templates.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Service admins can delete templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = templates.service_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample templates
INSERT INTO templates (name, description, type, subject, content, variables) VALUES
('Welcome Email', 'Sent to new users upon registration', 'email', 'Welcome to our service, {{firstName}}!', 'Dear {{title}} {{lastName}},

Welcome to our government service! We''re pleased to have you on board.

Your account details:
- Name: {{firstName}} {{lastName}}
- Email: {{email}}
- Registration Date: {{registrationDate}}

If you have any questions, please don''t hesitate to contact us.

Best regards,
The Government Service Team', ARRAY['title', 'firstName', 'lastName', 'email', 'registrationDate']),

('Appointment Reminder', '24-hour reminder for upcoming appointments', 'sms', NULL, 'Hi {{firstName}}, this is a reminder that you have an appointment tomorrow at {{appointmentTime}} at {{location}}. Please arrive 10 minutes early. Reply STOP to opt out.', ARRAY['firstName', 'appointmentTime', 'location']),

('Annual Statement', 'Yearly financial summary letter', 'letter', 'Your Annual Statement - {{year}}', 'Dear {{title}} {{lastName}},

Please find enclosed your annual statement for the year {{year}}.

Account Summary:
- Account Number: {{accountNumber}}
- Total Contributions: £{{totalContributions}}
- Current Balance: £{{currentBalance}}

If you have any questions about this statement, please contact us on {{contactNumber}}.

Yours sincerely,
{{departmentName}}', ARRAY['title', 'lastName', 'year', 'accountNumber', 'totalContributions', 'currentBalance', 'contactNumber', 'departmentName']),

('Password Reset', 'Security notification for password changes', 'email', 'Password Reset Request', 'Dear {{firstName}},

We received a request to reset your password for your government service account.

If you requested this change, please click the link below:
{{resetLink}}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email and contact our support team immediately.

Security Team
{{serviceName}}', ARRAY['firstName', 'resetLink', 'serviceName']),

('Service Alert', 'Urgent service notifications', 'sms', NULL, 'URGENT: {{serviceName}} will be unavailable from {{startTime}} to {{endTime}} on {{date}} for maintenance. We apologise for any inconvenience.', ARRAY['serviceName', 'startTime', 'endTime', 'date']);
