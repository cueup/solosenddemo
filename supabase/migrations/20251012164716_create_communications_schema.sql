/*
  # Create Communications and Contacts Schema

  ## Overview
  This migration creates the core database schema for tracking contacts and their communication history 
  in the GOV.UK Notify application.

  ## New Tables

  ### `contacts`
  Stores contact information for recipients of government communications.
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Title (Mr, Mrs, Ms, Miss, Dr, etc.)
  - `first_name` (text) - First name
  - `last_name` (text) - Last name
  - `email` (text, nullable) - Email address
  - `phone` (text, nullable) - Phone number
  - `address_line_1` (text, nullable) - Address line 1 (required for letters)
  - `address_line_2` (text, nullable) - Address line 2 (required for letters)
  - `address_line_3` (text, nullable) - Address line 3 (required for letters)
  - `address_line_4` (text, nullable) - Address line 4 (optional for letters)
  - `address_line_5` (text, nullable) - Address line 5 (required for letters - postcode or country)
  - `address_line_6` (text, nullable) - Address line 6 (optional for letters)
  - `address_line_7` (text, nullable) - Address line 7 (optional for letters)
  - `tags` (text[], array) - Tags for segmentation (VIP, Government, Citizens, Business)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `communications`
  Stores all communication history for audit and timeline purposes.
  - `id` (uuid, primary key) - Unique identifier
  - `contact_id` (uuid, foreign key) - References contacts table
  - `type` (text) - Communication type: email, sms, or letter
  - `subject` (text) - Subject or title of the communication
  - `content` (text) - Message content
  - `status` (text) - Status: scheduled, delivered, or failed
  - `scheduled_for` (timestamptz, nullable) - When the message should be sent
  - `sent_at` (timestamptz, nullable) - When the message was actually sent
  - `delivered_at` (timestamptz, nullable) - When delivery was confirmed
  - `pdf_attachment_url` (text, nullable) - URL for letter PDF attachments
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security

  ### Row Level Security (RLS)
  - Both tables have RLS enabled for data protection
  - Authenticated users can read and manage all contacts
  - Authenticated users can read and create communications
  - Service role has full access for system operations

  ### Policies Created
  
  #### contacts table:
  1. "Authenticated users can view all contacts" - SELECT access
  2. "Authenticated users can insert contacts" - INSERT access
  3. "Authenticated users can update contacts" - UPDATE access
  4. "Authenticated users can delete contacts" - DELETE access

  #### communications table:
  1. "Authenticated users can view all communications" - SELECT access
  2. "Authenticated users can create communications" - INSERT access
  3. "Authenticated users can update communications" - UPDATE access

  ## Indexes
  - Contact lookups by email, phone, and tags
  - Communication lookups by contact_id and status
  - Timestamp indexes for timeline queries

  ## Important Notes
  - All timestamps use `timestamptz` for proper timezone handling
  - Tags use PostgreSQL array type for flexible multi-tag support
  - Communication status is text-based for flexibility
  - Foreign key constraint ensures data integrity between tables
*/

-- Create contacts table with service isolation
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  first_name text NOT NULL,
  last_name text NOT NULL,
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create communications table (legacy - kept for backwards compatibility)
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  message_id uuid, -- Will reference messages table when created
  type text NOT NULL CHECK (type IN ('email', 'sms', 'letter')),
  subject text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delivered', 'failed', 'sent', 'processing')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  notify_id text, -- GOV.UK Notify message ID
  pdf_attachment_url text,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_service_id ON contacts(service_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(service_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(service_id, phone);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(service_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_communications_contact_id ON communications(contact_id);
CREATE INDEX IF NOT EXISTS idx_communications_message_id ON communications(message_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_scheduled_for ON communications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_communications_notify_id ON communications(notify_id);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Service members can view contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = contacts.service_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service editors and admins can insert contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = contacts.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Service editors and admins can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = contacts.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = contacts.service_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Service admins can delete contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_members 
      WHERE service_id = contacts.service_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Communications policies
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
