/*
  # Create members table and relationships

  1. New Tables
    - `members`
      - `member_id` (text, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `product_id` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Changes
    - Add foreign key from profiles to members table
    - Add RLS policies for members table

  3. Security
    - Enable RLS on members table
    - Add policies for authenticated users to read their own data
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  member_id text PRIMARY KEY,
  first_name text,
  last_name text,
  product_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Add foreign key to profiles table
ALTER TABLE profiles
ADD CONSTRAINT profiles_member_id_fkey
FOREIGN KEY (member_id)
REFERENCES members(member_id)
ON DELETE CASCADE;

-- Create policies
CREATE POLICY "Users can read own member data"
  ON members
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT member_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();