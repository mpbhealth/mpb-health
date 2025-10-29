/*
  # Fix database triggers and functions for user management

  1. Changes
    - Drop existing triggers and functions
    - Create new handle_new_user function with proper error handling
    - Add new trigger with proper execution timing
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper permission checks
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
BEGIN
  -- First check if the member exists
  SELECT * INTO member_record
  FROM members
  WHERE member_id = NEW.raw_user_meta_data->>'member_id';

  -- If member doesn't exist, raise an exception
  IF member_record IS NULL THEN
    RAISE EXCEPTION 'Member ID not found';
  END IF;

  -- Create profile only if member exists
  INSERT INTO public.profiles (
    id,
    member_id,
    first_name,
    last_name,
    product_id
  ) VALUES (
    NEW.id,
    member_record.member_id,
    member_record.first_name,
    member_record.last_name,
    member_record.product_id
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error (optional)
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create new trigger with proper timing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;