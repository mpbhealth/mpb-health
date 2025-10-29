/*
  # Add Delete Member Trigger

  1. Changes
    - Create trigger function to delete member after user creation
    - Add trigger to users table
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only deletes member if user creation was successful
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.delete_member_after_user_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the member record
  DELETE FROM members 
  WHERE member_id = NEW.member_id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER delete_member_after_user_created
  AFTER INSERT
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_member_after_user_creation();