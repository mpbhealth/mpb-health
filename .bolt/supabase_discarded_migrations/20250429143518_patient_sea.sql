/*
  # Remove timestamp columns from members table

  1. Changes
    - Remove created_at and updated_at columns from members table
    - Drop the update_members_updated_at trigger since it's no longer needed

  2. Notes
    - This is a safe migration that preserves all existing data
    - Only removes timestamp tracking functionality
*/

-- Drop the trigger first since it depends on the updated_at column
DROP TRIGGER IF EXISTS update_members_updated_at ON members;

-- Remove the columns
ALTER TABLE members 
DROP COLUMN IF EXISTS created_at,
DROP COLUMN IF EXISTS updated_at;