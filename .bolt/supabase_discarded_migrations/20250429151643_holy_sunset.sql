/*
  # Add email column to profiles table

  1. Changes
    - Add email column to profiles table
    - Add email to handle_new_user function
    - Update trigger function to include email

  2. Security
    - Maintain existing RLS policies
*/

-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN email text;

-- Update handle_new_user function to include email
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

  -- Create profile with email
  INSERT INTO public.profiles (
    id,
    member_id,
    first_name,
    last_name,
    product_id,
    email
  ) VALUES (
    NEW.id,
    v_member_id,
    v_first_name,
    v_last_name,
    v_product_id,
    NEW.email  -- Get email directly from auth.users table
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error details
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;