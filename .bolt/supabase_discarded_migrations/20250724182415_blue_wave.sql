/*
  # Remove members table and modify users table for CSV import

  1. Schema Changes
    - Drop foreign key constraints from users table
    - Drop primary key constraint on users.id
    - Make users.id nullable for CSV imports
    - Set member_id as new primary key
    - Add unique constraint on email
    - Drop members table

  2. Security
    - Disable RLS temporarily during migration
    - Re-enable RLS after schema changes
    - Note: RLS policies will need to be updated in a separate migration

  3. Important Notes
    - This migration removes the members table permanently
    - All existing RLS policies on users table will be affected
    - Application logic must be updated to handle nullable id field
*/

-- Temporarily disable RLS for schema modifications
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop existing foreign key constraints
DO $$
BEGIN
  -- Drop foreign key constraint from users.id to auth.users(id)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT profiles_id_fkey;
  END IF;

  -- Drop foreign key constraint from users.member_id to members.member_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_member_id_fkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_member_id_fkey;
  END IF;
END $$;

-- Drop primary key constraint on id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_pkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT profiles_pkey;
  END IF;
END $$;

-- Make id column nullable
ALTER TABLE public.users ALTER COLUMN id DROP NOT NULL;

-- Set member_id as the new primary key
ALTER TABLE public.users ADD PRIMARY KEY (member_id);

-- Add unique constraint on email (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_email_key' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Create index on id for faster lookups when linking auth records
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users (id);

-- Create index on email for faster lookups during sign-in
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Drop the members table (this will cascade and remove related constraints)
DROP TABLE IF EXISTS public.members CASCADE;

-- Re-enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (they will need to be recreated to handle nullable id)
DROP POLICY IF EXISTS "Enable client-side inserts" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data during signup" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Create basic policies to allow CSV import and user linking
-- Note: These are minimal policies - more comprehensive policies should be added later

-- Allow reading user data by auth.uid() or by email if id is null
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = id) OR
    (auth.email() = email AND id IS NULL)
  );

-- Allow updating user data to link auth.uid()
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = id) OR
    (auth.email() = email AND id IS NULL)
  )
  WITH CHECK (
    (auth.uid() = id) OR
    (auth.email() = email)
  );

-- Allow public read access for initial data (can be restricted later)
CREATE POLICY "Enable read access for all users"
  ON public.users
  FOR SELECT
  TO public
  USING (true);

-- Allow inserts during CSV import (can be restricted later)
CREATE POLICY "Enable inserts for CSV import"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);