-- Create the trigger function
CREATE OR REPLACE FUNCTION public.delete_member_after_user_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- Check if member_id exists in users table
  SELECT EXISTS (
    SELECT 1 
    FROM users 
    WHERE member_id = NEW.member_id
  ) INTO user_exists;

  -- Only delete from members if the user record exists
  IF user_exists THEN
    DELETE FROM members 
    WHERE member_id = NEW.member_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER delete_member_after_user_created
  AFTER INSERT
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_member_after_user_creation();