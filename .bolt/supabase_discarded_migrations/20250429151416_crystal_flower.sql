/*
  # Reset and recreate user management functions

  1. Changes
    - Drop existing triggers and functions with proper CASCADE
    - Create new handle_new_user function with improved validation
    - Add new trigger for user creation
    - Ensure RLS policies exist
    
  2. Security
    - Maintain RLS on all tables
    - Recreate necessary policies
*/

-- First, drop existing triggers with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS sync_auth_user_id ON auth.users CASCADE;

-- Now drop functions with CASCADE
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.sync_email_updates() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_email_update() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_email() CASCADE;

-- Create improved handle_new_user function with proper validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id text;
  v_first_name text;
  v_last_name text;
  v_product_id text;
  v_member_exists boolean;
BEGIN
  -- Extract data from raw_user_meta_data
  v_member_id := NEW.raw_user_meta_data->>'member_id';
  v_first_name := NEW.raw_user_meta_data->>'first_name';
  v_last_name := NEW.raw_user_meta_data->>'last_name';
  v_product_id := NEW.raw_user_meta_data->>'product_id';

  -- Validate required fields
  IF v_member_id IS NULL THEN
    RAISE EXCEPTION 'member_id is required';
  END IF;

  -- Check if member exists
  SELECT EXISTS (
    SELECT 1 
    FROM members 
    WHERE member_id = v_member_id
  ) INTO v_member_exists;

  IF NOT v_member_exists THEN
    RAISE EXCEPTION 'Member ID % not found', v_member_id;
  END IF;

  -- Get member details if not provided
  IF v_first_name IS NULL OR v_last_name IS NULL OR v_product_id IS NULL THEN
    SELECT 
      first_name,
      last_name,
      product_id
    INTO 
      v_first_name,
      v_last_name,
      v_product_id
    FROM members
    WHERE member_id = v_member_id;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    member_id,
    first_name,
    last_name,
    product_id
  ) VALUES (
    NEW.id,
    v_member_id,
    v_first_name,
    v_last_name,
    v_product_id
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error details
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Recreate policies if they don't exist
DO $$ 
BEGIN
  -- Profiles policies
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

  -- Members policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'members' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users"
      ON public.members
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'members' 
    AND policyname = 'Users can read own member data'
  ) THEN
    CREATE POLICY "Users can read own member data"
      ON public.members
      FOR SELECT
      TO authenticated
      USING (
        member_id IN (
          SELECT profiles.member_id
          FROM profiles
          WHERE profiles.id = auth.uid()
        )
      );
  END IF;
END $$;