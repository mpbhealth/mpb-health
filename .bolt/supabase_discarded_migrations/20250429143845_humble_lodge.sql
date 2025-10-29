/*
  # Update profiles table schema

  1. Changes
    - Remove `updated_at` column
    - Add `product_id` column (text, not null)

  2. Security
    - Existing RLS policies remain unchanged
*/

-- Drop the trigger first since it depends on the updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Remove updated_at and add product_id
ALTER TABLE profiles 
DROP COLUMN IF EXISTS updated_at,
ADD COLUMN product_id text NOT NULL;